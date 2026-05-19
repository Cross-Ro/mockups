// Global entry point
// Registers shared custom elements and initialises site-wide behaviours.
import BundleCtaComponent from 'TsComponents/bundle-cta-component';
import CarouselSwiper from 'TsComponents/carousel-swiper';
import migrateSection, { appendSection } from 'TsComponents/migrate-section';
import { initUIComponents } from 'TsComponents/ui-components';

document.addEventListener('DOMContentLoaded', () => {
  customElements.define('carousel-swiper', CarouselSwiper);
  if (customElements.get('bundle-cta-component') === undefined) {
    customElements.define('bundle-cta-component', BundleCtaComponent);
  }
  appendSection();
  migrateSection();
  initUIComponents();
});
