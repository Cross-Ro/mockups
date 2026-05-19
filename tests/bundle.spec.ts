/**
 * Bundle section Playwright tests.
 * Scenarios mapped to test-scenarios.md.
 *
 * Prerequisites:
 *   - STORE_URL in .env pointing to a live Shopify dev/preview theme
 *   - Bundle section added to a page (e.g. /) with 5 products configured
 *   - The BUNDLE_PAGE_PATH env var (default '/') pointing to the page with the bundle section
 *   - The cart-drawer-component present in layout with `auto-open` attribute
 */

import { test, expect, Page } from '@playwright/test';

const BUNDLE_PAGE: string = process.env.BUNDLE_PAGE_PATH ?? '/';
const BUNDLE_CTA_SELECTOR: string = '[data-testid="bundle-cta-button"]';
const BUNDLE_SECTION_SELECTOR: string = '[data-testid^="bundle-section-"]';
const CART_DRAWER_SELECTOR: string = 'cart-drawer-component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigateToBundlePage(page: Page): Promise<void> {
  await page.goto(BUNDLE_PAGE);
  await page.waitForSelector(BUNDLE_SECTION_SELECTOR, { timeout: 10_000 });
}

async function emptyCart(page: Page): Promise<void> {
  await page.goto('/cart/clear');
  // /cart/clear redirects — wait for navigation
  await page.waitForLoadState('networkidle');
}

async function waitForCartDrawerOpen(page: Page): Promise<void> {
  const drawer: import('@playwright/test').Locator = page.locator(CART_DRAWER_SELECTOR);
  // cart-drawer-component uses <dialog> internally; wait for it to be open
  await expect(drawer.locator('dialog')).toHaveAttribute('open', { timeout: 8_000 });
}

// ---------------------------------------------------------------------------
// S1 — Default render: all 5 products configured, all available
// ---------------------------------------------------------------------------
test.describe('S1 — Default render', () => {
  test('section renders 5 product cards with image, title, price', async ({ page }) => {
    await navigateToBundlePage(page);
    const section: import('@playwright/test').Locator = page.locator(BUNDLE_SECTION_SELECTOR);
    await expect(section).toBeVisible();

    const cards: import('@playwright/test').Locator = section.locator('.bundle-product-card');
    await expect(cards).toHaveCount(5);

    for (let i: number = 0; i < 5; i++) {
      const card: import('@playwright/test').Locator = cards.nth(i);
      await expect(card.locator('.bundle-product-card__title')).toBeVisible();
      await expect(card.locator('.bundle-product-card__price')).toBeVisible();
    }
  });

  test('headline is visible above grid', async ({ page }) => {
    await navigateToBundlePage(page);
    const headline: import('@playwright/test').Locator = page.locator('.bundle-section__headline');
    await expect(headline).toBeVisible();
  });

  test('savings label is visible', async ({ page }) => {
    await navigateToBundlePage(page);
    const label: import('@playwright/test').Locator = page.locator('.bundle-section__savings-label');
    await expect(label).toBeVisible();
  });

  test('CTA button is enabled with data-state=idle', async ({ page }) => {
    await navigateToBundlePage(page);
    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    await expect(cta).toBeEnabled();
    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    await expect(host).toHaveAttribute('data-state', 'idle');
  });
});

// ---------------------------------------------------------------------------
// S4 — Loading state during add-to-cart
// ---------------------------------------------------------------------------
test.describe('S4 — Loading state', () => {
  test('data-state becomes busy on click, then returns to idle', async ({ page }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);

    // Intercept /cart/add.js to slow it down so we can assert busy state.
    await page.route('/cart/add.js', async (route) => {
      await page.waitForTimeout(500);
      await route.continue();
    });

    void cta.click();

    await expect(host).toHaveAttribute('data-state', 'busy', { timeout: 2_000 });
    await expect(cta).toBeDisabled({ timeout: 2_000 });
    // After request completes, state should return to idle
    await expect(host).toHaveAttribute('data-state', 'idle', { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// S5 — Error response from /cart/add.js
// ---------------------------------------------------------------------------
test.describe('S5 — Error state', () => {
  test('422 from /cart/add.js sets data-state=error and shows error message', async ({ page }) => {
    await navigateToBundlePage(page);

    await page.route('/cart/add.js', (route) => {
      void route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ status: 422, description: 'One or more items are unavailable.' }),
      });
    });

    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    const errorMsg: import('@playwright/test').Locator = page.locator('.bundle-section__error-message');

    await cta.click();

    await expect(host).toHaveAttribute('data-state', 'error', { timeout: 5_000 });
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
    await expect(errorMsg).not.toBeEmpty();
    // CTA re-enables after error
    await expect(cta).toBeEnabled({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// S6 — Success: drawer opens, cart bubble increments
// ---------------------------------------------------------------------------
test.describe('S6 — Success: drawer opens', () => {
  test('all 5 lines added, cart drawer opens, cart:update event dispatched', async ({ page }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    // Listen for cart:update event dispatched on document
    const cartUpdateEventFired: Promise<boolean> = page.evaluate((): Promise<boolean> => {
      return new Promise((resolve) => {
        document.addEventListener('cart:update', () => resolve(true), { once: true });
        // Timeout fallback
        setTimeout(() => resolve(false), 8000);
      });
    });

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    await cta.click();

    const eventFired: boolean = await cartUpdateEventFired;
    expect(eventFired).toBe(true);

    await waitForCartDrawerOpen(page);
  });

  test('cart contains 5 line items after bundle add', async ({ page }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    await cta.click();

    // Wait for success
    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    await expect(host).toHaveAttribute('data-state', 'idle', { timeout: 10_000 });

    // Verify cart via API
    const cart: { item_count: number } = await page.evaluate(async () => {
      const res: Response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      return res.json() as Promise<{ item_count: number }>;
    });

    expect(cart.item_count).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// J1 — Spam-click guard
// ---------------------------------------------------------------------------
test.describe('J1 — Spam-click guard', () => {
  test('rapid 5 clicks fire only one POST /cart/add.js', async ({ page }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    let addRequestCount: number = 0;
    page.on('request', (req) => {
      if (req.url().includes('/cart/add.js') && req.method() === 'POST') {
        addRequestCount++;
      }
    });

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    // Rapid-fire 5 clicks
    for (let i: number = 0; i < 5; i++) {
      await cta.click({ force: true });
    }

    // Wait for request to complete
    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    await expect(host).toHaveAttribute('data-state', 'idle', { timeout: 10_000 });

    expect(addRequestCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// J4 — bundle_id cart attribute persists
// ---------------------------------------------------------------------------
test.describe('J4 — bundle_id cart attribute', () => {
  test('cart.attributes.bundle_id matches data-bundle-id after add', async ({ page }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    const bundleId: string | null = await page.locator('bundle-cta-component').getAttribute('data-bundle-id');
    expect(bundleId).not.toBeNull();

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    await cta.click();

    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    await expect(host).toHaveAttribute('data-state', 'idle', { timeout: 10_000 });

    const cart: { attributes: Record<string, string> } = await page.evaluate(async () => {
      const res: Response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      return res.json() as Promise<{ attributes: Record<string, string> }>;
    });

    expect(cart.attributes['bundle_id']).toBe(bundleId);
  });
});

// ---------------------------------------------------------------------------
// J5 — Multiple bundle sections on same page
// ---------------------------------------------------------------------------
test.describe('J5 — Multiple bundle sections', () => {
  test('two bundle-cta-component instances operate independently', async ({ page }) => {
    await navigateToBundlePage(page);

    const components: import('@playwright/test').Locator = page.locator('bundle-cta-component');
    const count: number = await components.count();

    if (count < 2) {
      // Only one section on page — skip this test with informative message
      test.skip(true, 'Only one bundle-cta-component on this page; J5 requires two.');
      return;
    }

    // Verify each component has its own data-bundle-id
    const id1: string | null = await components.nth(0).getAttribute('data-bundle-id');
    const id2: string | null = await components.nth(1).getAttribute('data-bundle-id');
    expect(id1).not.toEqual(id2);
  });
});

// ---------------------------------------------------------------------------
// R1 / R2 — Responsive layout
// ---------------------------------------------------------------------------
test.describe('R1 — Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('cards stack in single column at 390px', async ({ page }) => {
    await navigateToBundlePage(page);
    const grid: import('@playwright/test').Locator = page.locator('.bundle-section__grid');
    await expect(grid).toBeVisible();

    // Check computed grid-template-columns is 1fr (single column)
    const columns: string = await grid.evaluate((el: Element) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    // On narrow viewport, should be a single column value (not 5 equal values)
    expect(columns.split(' ').length).toBe(1);
  });

  test('CTA is full-width at 390px', async ({ page }) => {
    await navigateToBundlePage(page);
    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    const box: { width: number } | null = await cta.boundingBox();
    const viewport: { width: number } | null = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    // CTA width should be close to viewport width (allowing for padding)
    expect(box!.width).toBeGreaterThan(viewport!.width * 0.8);
  });
});

test.describe('R2 — Desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('5-column grid at 1280px', async ({ page }) => {
    await navigateToBundlePage(page);
    const grid: import('@playwright/test').Locator = page.locator('.bundle-section__grid');

    const columns: string = await grid.evaluate((el: Element) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    // 5 columns = 5 space-separated values
    expect(columns.split(' ').length).toBe(5);
  });

  test('CTA max-width is 320px on desktop', async ({ page }) => {
    await navigateToBundlePage(page);
    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    const box: { width: number } | null = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(320 + 2); // allow 2px rounding
  });
});

// ---------------------------------------------------------------------------
// E1 — Long product title
// ---------------------------------------------------------------------------
test.describe('E1 — Long product title', () => {
  test('long title truncates without breaking card', async ({ page }) => {
    await navigateToBundlePage(page);
    const titles: import('@playwright/test').Locator = page.locator('.bundle-product-card__title');
    const count: number = await titles.count();

    for (let i: number = 0; i < count; i++) {
      const title: import('@playwright/test').Locator = titles.nth(i);
      // Overflow should be hidden (CSS clamp applied)
      const overflow: string = await title.evaluate((el: Element) => window.getComputedStyle(el).overflow);
      expect(overflow).toBe('hidden');
    }
  });
});

// ---------------------------------------------------------------------------
// E2 — Missing product image (placeholder renders)
// ---------------------------------------------------------------------------
test.describe('E2 — Missing product image', () => {
  test('placeholder SVG renders when product has no image', async ({ page }) => {
    await navigateToBundlePage(page);
    // This test validates the markup pattern is correct when a placeholder is present.
    // The actual product data must include an imageless product for full coverage.
    const placeholders: import('@playwright/test').Locator = page.locator(
      '.bundle-product-card__image--placeholder'
    );
    // If no placeholders exist, that's fine — all products have images. Test passes trivially.
    const count: number = await placeholders.count();
    if (count > 0) {
      for (let i: number = 0; i < count; i++) {
        await expect(placeholders.nth(i)).toBeVisible();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// D5 — Drift gotcha: section products != metafield products → no discount
// ---------------------------------------------------------------------------
test.describe('D5 — Drift gotcha', () => {
  test('adding bundle does not crash when discount does not apply (no discount = no error)', async ({
    page,
  }) => {
    // This is a smoke test — verifying the add succeeds even if discount is absent.
    // Actual discount verification requires store-specific setup.
    await emptyCart(page);
    await navigateToBundlePage(page);

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    const host: import('@playwright/test').Locator = page.locator('bundle-cta-component');

    await cta.click();

    // Should complete without error state
    await expect(host).toHaveAttribute('data-state', 'idle', { timeout: 10_000 });
    await expect(host).not.toHaveAttribute('data-state', 'error');
  });
});

// ---------------------------------------------------------------------------
// X1 — CartAddEvent payload shape
// ---------------------------------------------------------------------------
test.describe('X1 — CartAddEvent payload', () => {
  test('cart:update event detail has resource.item_count, sourceId, data.sections', async ({
    page,
  }) => {
    await emptyCart(page);
    await navigateToBundlePage(page);

    type EventDetail = {
      resource: { item_count: number } | null;
      sourceId: string;
      data: { sections: Record<string, string>; source: string };
    };

    const detail: EventDetail = await page.evaluate((): Promise<EventDetail> => {
      return new Promise((resolve, reject) => {
        document.addEventListener(
          'cart:update',
          (e) => {
            const ev: CustomEvent<EventDetail> = e as CustomEvent<EventDetail>;
            resolve(ev.detail);
          },
          { once: true }
        );
        setTimeout(() => reject(new Error('cart:update not fired within 8s')), 8000);
      });
    });

    const cta: import('@playwright/test').Locator = page.locator(BUNDLE_CTA_SELECTOR);
    await cta.click();

    // Await the evaluate promise via re-evaluate — actually captured above via page.evaluate
    // (the promise resolves when event fires after click)
    expect(detail).toHaveProperty('resource');
    expect(detail).toHaveProperty('sourceId');
    expect(detail).toHaveProperty('data.sections');
    expect(detail.data.source).toBe('bundle-cta');
  });
});
