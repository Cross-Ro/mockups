# Playwright Password Handler

Reusable snippet for agents using Playwright MCP to navigate Shopify preview URLs.

## URL Construction

Build the preview URL from `.env`:

```
Base URL: https://{STORE_URL}?preview_theme_id={THEME_ID}
Full URL: https://{STORE_URL}/{page_path}?preview_theme_id={THEME_ID}
```

Example: `https://umesh-dev-store.myshopify.com/pages/about-us?preview_theme_id=168567275799`

## Password Page Handler

Shopify dev stores require password entry. Run this after every `page.goto()`:

```ts
async function handlePasswordPage(page, targetUrl = null) {
  const currentUrl = page.url();
  const isPasswordPage = currentUrl.includes('/password') ||
    await page.locator('input[type="password"]').isVisible().catch(() => false);

  if (isPasswordPage) {
    const password = process.env.STORE_PASSWORD || 'adapt';

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(password);

    const enterButton = page.locator('button:has-text("Enter"), input[type="submit"]');
    await enterButton.waitFor({ state: 'visible', timeout: 10000 });
    await enterButton.click();

    await page.waitForURL((url) => !url.pathname.includes('/password'), { timeout: 15000 });

    if (targetUrl && !page.url().includes(targetUrl)) {
      await page.goto(targetUrl);
      await page.waitForLoadState('domcontentloaded');
    }
  }
}
```

## Usage Pattern

Every agent that navigates via Playwright must:
1. Read `STORE_URL` and `THEME_ID` from `.env`
2. Ask user for the page path (e.g., `/pages/about-us`, `/collections/all`)
3. Construct full URL: `https://${STORE_URL}${pagePath}?preview_theme_id=${THEME_ID}`
4. After `page.goto(fullUrl)`, call `handlePasswordPage(page, fullUrl)`
5. Only then proceed with inspection/testing
