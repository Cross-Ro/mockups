// Global entry point
// Registers shared custom elements and initialises site-wide behaviours.
import CarouselSwiper from 'TsComponents/carousel-swiper';
import migrateSection, { appendSection } from 'TsComponents/migrate-section';
import { initUIComponents } from 'TsComponents/ui-components';

document.addEventListener('DOMContentLoaded', () => {
  customElements.define('carousel-swiper', CarouselSwiper);
  appendSection();
  migrateSection();
  initUIComponents();
});
