import Swiper from 'swiper';
import type { SwiperOptions } from 'swiper/types';
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from 'swiper/modules';

interface CarouselConfig extends SwiperOptions {
  progressBarSelector?: string;
}

class CarouselSwiper extends HTMLElement {
  private swiper: Swiper | null = null;
  private _buttonObserver: MutationObserver | null = null;
  private _resizeHandler: (() => void) | null = null;
  private autoplayProgressBar: HTMLElement | null = null;
  private paginationEl: HTMLElement | null = null;

  connectedCallback(): void {
    const settingsScript = this.querySelector<HTMLScriptElement>('script[type="application/json"]');
    const settings: CarouselConfig = settingsScript ? JSON.parse(settingsScript.textContent ?? '{}') : {};

    const defaultSettings: CarouselConfig = {
      slidesPerView: 'auto',
      spaceBetween: 20,
      centeredSlides: false,
      grabCursor: true,
      freeMode: false,
      progressBarSelector: undefined,
      navigation: false,
      pagination: false,
      breakpoints: {},
      autoplay: false,
    };

    const config: CarouselConfig = { ...defaultSettings, ...settings };
    const swiperContainer = this.querySelector<HTMLElement>('.swiper');
    if (!swiperContainer) return;

    const navigationConfig: Partial<SwiperOptions> = {};

    if (config.navigation) {
      const closestParent = this.closest<HTMLElement>('[data-swiper-parent]');
      let prevButton = (closestParent ?? this).querySelector<HTMLButtonElement>('.swiper-button-prev')
        ?? (closestParent ?? this).querySelector<HTMLButtonElement>('.carousel__nav-button--prev');
      let nextButton = (closestParent ?? this).querySelector<HTMLButtonElement>('.swiper-button-next')
        ?? (closestParent ?? this).querySelector<HTMLButtonElement>('.carousel__nav-button--next');

      if (!prevButton || !nextButton) {
        const navContainer = this.querySelector<HTMLElement>('.carousel__navigation') ?? document.createElement('div');
        if (!navContainer.classList.contains('carousel__navigation')) {
          navContainer.className = 'carousel__navigation tw-flex tw-items-center tw-justify-end tw-gap-3 tw-mt-8';
          this.appendChild(navContainer);
        }

        if (!prevButton) {
          prevButton = document.createElement('button');
          prevButton.className = 'carousel__nav-button carousel__nav-button--prev tw-w-[48px] tw-h-[48px] tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all hover:tw-border-slate-400 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed';
          prevButton.type = 'button';
          prevButton.setAttribute('aria-label', 'Previous slide');
          prevButton.setAttribute('tabindex', '0');
          prevButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <g clip-path="url(#clip0_prev)">
                <path d="M47 24C47 11.2975 36.7025 1 24 1C11.2975 1 1 11.2975 1 24C1 36.7025 11.2975 47 24 47C36.7025 47 47 36.7025 47 24ZM48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z" fill="currentColor"/>
                <path d="M28 16L20 24L28 32" stroke="currentColor" stroke-width="2"/>
              </g>
              <defs><clipPath id="clip0_prev"><rect width="48" height="48" fill="white"/></clipPath></defs>
            </svg>`;
          navContainer.appendChild(prevButton);
        }

        if (!nextButton) {
          nextButton = document.createElement('button');
          nextButton.className = 'carousel__nav-button carousel__nav-button--next tw-w-[48px] tw-h-[48px] tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all hover:tw-border-slate-400 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed';
          nextButton.type = 'button';
          nextButton.setAttribute('aria-label', 'Next slide');
          nextButton.setAttribute('tabindex', '0');
          nextButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <g clip-path="url(#clip0_next)">
                <path d="M47 24C47 11.2975 36.7025 1 24 1C11.2975 1 1 11.2975 1 24C1 36.7025 11.2975 47 24 47C36.7025 47 47 36.7025 47 24ZM48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z" fill="currentColor"/>
                <path d="M29.4141 24L20.707 32.707L19.293 31.293L26.5859 24L19.293 16.707L20.707 15.293L29.4141 24Z" fill="currentColor"/>
              </g>
              <defs><clipPath id="clip0_next"><rect width="48" height="48" fill="white"/></clipPath></defs>
            </svg>`;
          navContainer.appendChild(nextButton);
        }
      }

      if (prevButton && nextButton) {
        navigationConfig.navigation = { prevEl: prevButton, nextEl: nextButton };

        const observer = new MutationObserver(() => {
          if (!prevButton || !nextButton) return;
          prevButton.setAttribute('tabindex', '0');
          prevButton.setAttribute('aria-disabled', prevButton.hasAttribute('disabled') ? 'true' : 'false');
          nextButton.setAttribute('tabindex', '0');
          nextButton.setAttribute('aria-disabled', nextButton.hasAttribute('disabled') ? 'true' : 'false');
        });
        observer.observe(prevButton, { attributes: true, attributeFilter: ['disabled', 'class'] });
        observer.observe(nextButton, { attributes: true, attributeFilter: ['disabled', 'class'] });
        this._buttonObserver = observer;
      }
    }

    const paginationConfig: Partial<SwiperOptions> = {};
    if (config.pagination) {
      const paginationParent = this.closest<HTMLElement>('[data-swiper-parent]');
      const paginationEl = this.querySelector<HTMLElement>('.swiper-pagination')
        ?? paginationParent?.querySelector<HTMLElement>('.swiper-pagination')
        ?? null;
      if (paginationEl) {
        paginationConfig.pagination = { el: paginationEl, type: 'bullets', clickable: true };
      }
    }

    const autoplayConfig: Partial<SwiperOptions> = {};
    const isAutoplayEnabled = config.autoplay && (typeof config.autoplay === 'object' || config.autoplay === true);

    if (isAutoplayEnabled) {
      const autoplaySettings = typeof config.autoplay === 'object' ? config.autoplay : {};
      autoplayConfig.autoplay = {
        delay: 3000,
        disableOnInteraction: true,
        pauseOnMouseEnter: false,
        ...autoplaySettings,
      };

      this.autoplayProgressBar = this.querySelector<HTMLElement>('.autoplay-progress__bar');
      const autoplayParent = this.closest<HTMLElement>('[data-swiper-parent]');
      this.paginationEl = this.querySelector<HTMLElement>('.swiper-pagination')
        ?? autoplayParent?.querySelector<HTMLElement>('.swiper-pagination')
        ?? null;
    }

    this.swiper = new Swiper(swiperContainer, {
      modules: [Navigation, Pagination, A11y, Keyboard, Autoplay],
      slidesPerView: config.slidesPerView,
      spaceBetween: config.spaceBetween,
      centeredSlides: config.centeredSlides,
      grabCursor: config.grabCursor,
      freeMode: config.freeMode,
      breakpoints: config.breakpoints,
      slidesOffsetAfter: config.slidesOffsetAfter ?? 0,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide',
      },
      direction: config.direction ?? 'horizontal',
      ...navigationConfig,
      ...paginationConfig,
      ...autoplayConfig,
      on: {
        slideChange: () => {
          this.updateProgress(config);
          this.updateButtonAccessibility();
          this.updateSlideFocusability();
          if (this.autoplayProgressBar) this.autoplayProgressBar.style.width = '0%';
          this.resetPaginationProgress();
        },
        init: () => {
          this.updateProgress(config);
          this.updateButtonAccessibility();
          this.updateSlideFocusability();
          this.resetPaginationProgress();
        },
        slideChangeTransitionEnd: () => this.updateSlideFocusability(),
        autoplayTimeLeft: (_swiper, _timeLeft, progress) => this.updateAutoplayProgress(progress),
      },
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    this._resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.updateSlideFocusability(), 100);
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  private updateProgress(config: CarouselConfig): void {
    if (!config.progressBarSelector || !this.swiper) return;
    const progressBar = document.querySelector<HTMLElement>(config.progressBarSelector);
    if (progressBar) {
      const progress = ((this.swiper.activeIndex + 1) / this.swiper.slides.length) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  private updateButtonAccessibility(): void {
    if (!this.swiper) return;
    const parent = this.closest<HTMLElement>('[data-swiper-parent]') ?? this;
    const prevButton = parent.querySelector<HTMLElement>('.carousel__nav-button--prev, .swiper-button-prev');
    const nextButton = parent.querySelector<HTMLElement>('.carousel__nav-button--next, .swiper-button-next');

    if (prevButton) {
      prevButton.setAttribute('tabindex', '0');
      prevButton.setAttribute('aria-disabled', this.swiper.isBeginning ? 'true' : 'false');
    }
    if (nextButton) {
      nextButton.setAttribute('tabindex', '0');
      nextButton.setAttribute('aria-disabled', this.swiper.isEnd ? 'true' : 'false');
    }
  }

  private updateSlideFocusability(): void {
    if (!this.swiper) return;
    const swiperEl = this.swiper.el;
    const swiperRect = swiperEl.getBoundingClientRect();

    swiperEl.querySelectorAll<HTMLElement>('.swiper-slide').forEach(slide => {
      const { right, left, bottom, top } = slide.getBoundingClientRect();
      const isVisible = right > swiperRect.left && left < swiperRect.right
        && bottom > swiperRect.top && top < swiperRect.bottom;

      slide.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ).forEach(el => {
        if (isVisible) {
          if (el.getAttribute('tabindex') === '-1') el.removeAttribute('tabindex');
          if (el.tagName === 'A' || el.tagName === 'BUTTON') el.removeAttribute('tabindex');
        } else {
          el.setAttribute('tabindex', '-1');
        }
      });
    });
  }

  private updateAutoplayProgress(progress: number): void {
    const pct = (1 - progress) * 100;
    if (this.autoplayProgressBar) this.autoplayProgressBar.style.width = `${pct}%`;
    if (this.paginationEl) {
      this.paginationEl.querySelector<HTMLElement>('.swiper-pagination-bullet-active')
        ?.style.setProperty('--progress-width', `${pct}%`);
    }
  }

  private resetPaginationProgress(): void {
    if (!this.paginationEl) return;
    this.paginationEl.querySelectorAll<HTMLElement>('.swiper-pagination-bullet')
      .forEach(bullet => bullet.style.setProperty('--progress-width', '0%'));
  }

  disconnectedCallback(): void {
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    this.swiper?.destroy();
    this.swiper = null;
  }
}

export default CarouselSwiper;
