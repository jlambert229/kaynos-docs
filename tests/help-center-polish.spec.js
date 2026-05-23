// Coverage for KAY-1589 — the new 404 page, the ?q= search bootstrap,
// and the article-feedback widget's Linear handoff path.

const { test, expect } = require('@playwright/test');

test.describe('404 page', () => {
  test('renders friendly 404 with search and popular links', async ({ page }) => {
    const res = await page.goto('/404.html');
    // The static file resolves 200 when fetched directly; Netlify serves it as
    // 404 only for unmatched routes in production. We only care about content.
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('h1')).toContainText('moved or never existed');
    await expect(page.locator('input[type="search"][name="q"]')).toBeVisible();
    await expect(page.locator('ul.popular li')).not.toHaveCount(0);
    await expect(page.locator('ul.popular a[href="/#setup"]')).toBeVisible();
    await expect(page.locator('a.primary[href="/"]')).toBeVisible();
  });

  test('search form forwards to / with ?q= query string', async ({ page }) => {
    await page.goto('/404.html');
    await page.locator('input[type="search"][name="q"]').fill('upload');
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/' && url.search.includes('q=upload')),
      page.locator('form.search button[type="submit"]').click(),
    ]);
  });
});

test.describe('?q= prefill on the help center', () => {
  test('prefills the header search input and shows results', async ({ page }) => {
    await page.goto('/?q=upload');
    const input = page.locator('#searchInput');
    await expect(input).toHaveValue('upload');
    // Results pane should open. The site uses .search-results.active to render
    // matches; allow a brief debounce window before asserting.
    await expect(page.locator('.search-results.active')).toBeVisible({ timeout: 3000 });
    // The query string is stripped so reloads don't re-trigger.
    await expect.poll(() => page.url()).not.toContain('?q=');
  });
});

test.describe('Article feedback widget', () => {
  test('Yes button dismisses without opening the composer', async ({ page }) => {
    await page.goto('/#playback');
    // Clear any prior dismissal so the widget renders fresh.
    await page.evaluate(() => localStorage.removeItem('article-feedback-given'));
    await page.reload();
    const widget = page.locator('.article-feedback[data-page="playback"]');
    await expect(widget).toBeVisible();
    const composer = widget.locator('.article-feedback-form');
    await expect(composer).toBeHidden();
    await widget.locator('.article-feedback-btn').first().click(); // "Yes"
    await expect(widget.locator('.article-feedback-thanks')).toBeVisible();
    await expect(composer).toBeHidden();
  });

  test('No button reveals composer and submits to Linear endpoint', async ({ page }) => {
    let requested = false;
    await page.route('https://www.kaynos.net/.netlify/functions/feature-request', async (route) => {
      requested = true;
      const body = route.request().postDataJSON();
      // The widget should namespace the title and include the page slug.
      expect(body.title).toContain('Docs feedback:');
      expect(body.description).toContain('#playback');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, identifier: 'KAY-9999' }),
      });
    });

    await page.goto('/#playback');
    await page.evaluate(() => localStorage.removeItem('article-feedback-given'));
    await page.reload();
    const widget = page.locator('.article-feedback[data-page="playback"]');
    await widget.locator('.article-feedback-btn').nth(1).click(); // "No"
    const ta = widget.locator('textarea');
    await expect(ta).toBeVisible();
    await ta.fill('Notes on this page were unclear.');
    await widget.locator('.article-feedback-submit').click();
    await expect(widget.locator('.article-feedback-thanks')).toContainText(/queue/i);
    expect(requested).toBe(true);
  });
});

test.describe('New articles registered', () => {
  for (const slug of ['ai-inbox', 'scrutiny-picker', 'school-switcher']) {
    test(`#${slug} resolves to a real page`, async ({ page }) => {
      await page.goto(`/#${slug}`);
      // h1 inside the rendered content reflects the page title from PAGES[].
      await expect(page.locator('.content-inner h1').first()).toBeVisible();
      // The "Page not found" fallback would render a paragraph mentioning it;
      // assert the slug-specific copy is on the page instead.
      const body = await page.locator('.content-inner').textContent();
      expect(body && body.toLowerCase()).not.toContain('page not found');
    });
  }
});
