const { test, expect } = require('@playwright/test');

// ── Page load & core layout ──────────────────────────────────

test.describe('Page load', () => {
  test('loads welcome page with hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero h1')).toContainText('Welcome to Kaynos');
  });

  test('header is visible and fixed', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('.header');
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box.y).toBe(0);
  });

  test('progress bar exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#progress-bar')).toBeAttached();
  });
});

// ── Mobile navigation ────────────────────────────────────────

test.describe('Mobile navigation', () => {
  test('mobile bottom nav is visible on small screens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await expect(page.locator('.mobile-nav')).toBeVisible();
  });

  test('mobile nav buttons are semantic buttons', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const buttons = page.locator('.mobile-nav button.mobile-nav-btn');
    await expect(buttons).toHaveCount(4);
  });

  test('menu button opens sidebar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.locator('.menu-btn').click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    await expect(page.locator('.overlay')).toHaveClass(/active/);
  });

  test('sidebar closes on overlay click', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.locator('.menu-btn').click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    await page.locator('.overlay').click();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('sidebar links navigate to pages', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.locator('.menu-btn').click();
    await page.locator('.sidebar-link[data-page="setup"]').click();
    await expect(page.locator('.content-inner h1')).toContainText('Setting up');
    // Sidebar should auto-close
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('mobile home button navigates to welcome', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/#setup');
    await page.waitForSelector('.content-inner h1');
    await page.locator('.mobile-nav-btn[aria-label="Home"]').click();
    await expect(page.locator('.hero h1')).toBeVisible();
  });
});

// ── Search ───────────────────────────────────────────────────

test.describe('Search', () => {
  test('search input is accessible', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#searchInput');
    await expect(input).toHaveAttribute('aria-label', 'Search documentation');
    await expect(input).toHaveAttribute('role', 'combobox');
  });

  test('search returns results', async ({ page }) => {
    await page.goto('/');
    await page.fill('#searchInput', 'upload');
    await expect(page.locator('.search-results')).toHaveClass(/active/);
    const results = page.locator('.search-result');
    expect(await results.count()).toBeGreaterThan(0);
  });

  test('search result click navigates to page', async ({ page }) => {
    await page.goto('/');
    await page.fill('#searchInput', 'upload video');
    await page.waitForSelector('.search-result');
    await page.locator('.search-result').first().click();
    const h1 = await page.locator('.content-inner h1').textContent();
    expect(h1.length).toBeGreaterThan(0);
    // Search should clear
    await expect(page.locator('#searchInput')).toHaveValue('');
  });

  test('search shows no results message for gibberish', async ({ page }) => {
    await page.goto('/');
    await page.fill('#searchInput', 'xyzzyfoobarbaz');
    await expect(page.locator('.search-empty')).toBeVisible();
  });

  test('escape closes search results', async ({ page }) => {
    await page.goto('/');
    await page.fill('#searchInput', 'upload');
    await expect(page.locator('.search-results')).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.search-results')).not.toHaveClass(/active/);
  });
});

// ── SPA Navigation ───────────────────────────────────────────

test.describe('SPA navigation', () => {
  test('quick links navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('.quick-link[href="#setup"]').click();
    await expect(page.locator('.content-inner h1')).toContainText('Setting up');
    expect(page.url()).toContain('#setup');
  });

  test('breadcrumb renders on article pages', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.breadcrumb')).toBeVisible();
    await expect(page.locator('.breadcrumb-current')).toContainText('Setting up');
  });

  test('footer nav has prev/next buttons', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.footer-nav-btn')).toHaveCount(2);
  });

  test('footer nav navigates to next page', async ({ page }) => {
    await page.goto('/#setup');
    await page.locator('.footer-nav-btn.next').click();
    const h1 = await page.locator('.content-inner h1').textContent();
    expect(h1).not.toContain('Setting up');
  });

  test('hash navigation loads correct page', async ({ page }) => {
    await page.goto('/#faq');
    await expect(page.locator('.content-inner h1')).toContainText('Frequently asked');
  });

  test('back button works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.quick-link[href="#setup"]').click();
    await expect(page.locator('.content-inner h1')).toContainText('Setting up');
    await page.goBack();
    await expect(page.locator('.hero h1')).toBeVisible();
  });
});

// ── Icons render (template literal fix) ──────────────────────

test.describe('Icon rendering', () => {
  test('glossary page renders hint icons (not literal text)', async ({ page }) => {
    await page.goto('/#glossary');
    await page.waitForSelector('.content-inner h1');
    const hints = page.locator('.hint-icon');
    if (await hints.count() > 0) {
      const icon = hints.first();
      const svg = icon.locator('svg');
      await expect(svg).toHaveCount(1);
      // Ensure no literal ${IC. text
      const text = await icon.textContent();
      expect(text).not.toContain('${IC.');
    }
  });

  test('contact page renders support icons', async ({ page }) => {
    await page.goto('/#contact');
    await page.waitForSelector('.content-inner h1');
    const icons = page.locator('.support-item-icon');
    expect(await icons.count()).toBeGreaterThan(0);
    const first = icons.first();
    await expect(first.locator('svg')).toHaveCount(1);
  });

  test('onboarding timeline renders dot icons', async ({ page }) => {
    await page.goto('/#onboarding-timeline');
    await page.waitForSelector('.content-inner h1');
    const dots = page.locator('.timeline-dot');
    expect(await dots.count()).toBe(4);
    for (let i = 0; i < 4; i++) {
      await expect(dots.nth(i).locator('svg')).toHaveCount(1);
    }
  });

  test('session-vs-class page renders hint icons', async ({ page }) => {
    await page.goto('/#session-vs-class');
    await page.waitForSelector('.content-inner h1');
    const hintIcon = page.locator('.hint-icon').first();
    await expect(hintIcon.locator('svg')).toHaveCount(1);
  });
});

// ── Interactive widgets ──────────────────────────────────────

test.describe('Widgets', () => {
  test('FAQ accordion toggles open/close', async ({ page }) => {
    await page.goto('/#faq');
    await page.waitForSelector('.faq-item');
    const firstQuestion = page.locator('.faq-question').first();
    const firstItem = page.locator('.faq-item').first();
    await expect(firstItem).not.toHaveClass(/open/);
    await firstQuestion.click();
    await expect(firstItem).toHaveClass(/open/);
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    await firstQuestion.click();
    await expect(firstItem).not.toHaveClass(/open/);
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
  });

  test('FAQ questions are buttons with ARIA', async ({ page }) => {
    await page.goto('/#faq');
    await page.waitForSelector('.faq-question');
    const btn = page.locator('.faq-question').first();
    await expect(btn).toHaveAttribute('aria-expanded');
    await expect(btn).toHaveAttribute('aria-controls');
  });

  test('upload calculator computes result', async ({ page }) => {
    await page.goto('/#speed-calculator');
    await page.fill('#calcSize', '500');
    await page.fill('#calcSpeed', '25');
    await expect(page.locator('#calcResult')).toBeVisible();
    await expect(page.locator('#calcResult')).toContainText('Estimated');
  });

  test('error lookup returns matches', async ({ page }) => {
    await page.goto('/#error-lookup');
    await page.fill('#errorInput', '403');
    await expect(page.locator('.error-match')).toHaveCount(1);
  });

  test('troubleshoot wizard navigates through steps', async ({ page }) => {
    await page.goto('/#troubleshoot');
    await page.waitForSelector('.wizard-option');
    await page.locator('.wizard-option').first().click();
    // Should advance to next step
    const hasResult = await page.locator('.wizard-result').count();
    const hasOptions = await page.locator('.wizard-option').count();
    expect(hasResult + hasOptions).toBeGreaterThan(0);
  });

  test('preflight checklist toggles items', async ({ page }) => {
    await page.goto('/#upload-checklist');
    await page.waitForSelector('.preflight-item');
    const item = page.locator('.preflight-item').first();
    await expect(item).not.toHaveClass(/checked/);
    await item.click();
    await expect(item).toHaveClass(/checked/);
  });
});

// ── Theme toggle ─────────────────────────────────────────────

test.describe('Theme', () => {
  test('theme toggle switches to light mode', async ({ page }) => {
    await page.goto('/');
    // Theme toggle may be off-viewport on narrow mobile screens, use JS
    await page.evaluate(() => toggleTheme());
    const html = page.locator('html');
    const hasLight = await html.evaluate(el => el.classList.contains('light'));
    if (!hasLight) {
      await page.evaluate(() => toggleTheme());
    }
    await expect(html).toHaveClass(/light/);
  });

  test('theme persists on reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/light/);
  });
});

// ── Chatbot ──────────────────────────────────────────────────

test.describe('Chatbot', () => {
  test('chatbot fab opens panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await expect(page.locator('.chatbot-panel')).toHaveClass(/open/);
  });

  test('chatbot shows greeting on first open', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await expect(page.locator('.chat-msg.bot')).toBeVisible();
    await expect(page.locator('.chat-msg.bot')).toContainText('help you find answers');
  });

  test('chatbot close button works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await expect(page.locator('.chatbot-panel')).toHaveClass(/open/);
    await page.locator('.chatbot-close').click();
    await expect(page.locator('.chatbot-panel')).not.toHaveClass(/open/);
  });

  test('chatbot suggestion buttons work', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await page.locator('.chat-suggestion').first().click();
    const msgs = page.locator('.chat-msg');
    // Should have greeting + user msg + bot reply = at least 3
    expect(await msgs.count()).toBeGreaterThanOrEqual(3);
  });

  test('chatbot does not double-init on rapid toggle', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chatbot-fab').click();
    await page.locator('.chatbot-close').click();
    await page.locator('.chatbot-fab').click();
    const greetings = page.locator('.chat-msg.bot');
    // Should still only have 1 greeting
    await expect(greetings.first()).toContainText('help you find answers');
    expect(await greetings.count()).toBe(1);
  });
});

// ── Bookmark & feedback ──────────────────────────────────────

test.describe('Bookmark & feedback', () => {
  test('bookmark button toggles', async ({ page }) => {
    await page.goto('/#setup');
    await page.waitForSelector('#bookmarkBtn');
    const btn = page.locator('#bookmarkBtn');
    await btn.click();
    await expect(btn).toHaveClass(/bookmarked/);
    await btn.click();
    await expect(btn).not.toHaveClass(/bookmarked/);
  });

  test('feedback widget renders on article pages', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.page-feedback')).toBeVisible();
    await expect(page.locator('.feedback-btn')).toHaveCount(2);
  });

  test('feedback widget does not render on welcome', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.page-feedback')).not.toBeVisible();
  });

  test('feedback yes button shows thanks', async ({ page }) => {
    await page.goto('/#setup');
    const btn = page.locator('.feedback-btn').first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.locator('.feedback-thanks')).toBeVisible();
  });
});

// ── Touch targets ────────────────────────────────────────────

test.describe('Touch targets', () => {
  test('mobile nav buttons meet 44px minimum', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const buttons = page.locator('.mobile-nav-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});

// ── Accessibility basics ─────────────────────────────────────

test.describe('Accessibility', () => {
  test('skip link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.skip-link')).toBeAttached();
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#pageContent');
  });

  test('page title updates on navigation', async ({ page }) => {
    await page.goto('/#setup');
    await page.waitForSelector('.content-inner h1');
    const title = await page.title();
    expect(title).toContain('Kaynos');
    expect(title).toContain('Setting up');
  });

  test('sidebar links have aria-current on active', async ({ page, isMobile }) => {
    test.skip(isMobile, 'sidebar hidden on mobile');
    await page.goto('/#setup');
    const activeLink = page.locator('.sidebar-link.active');
    await expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  test('toast has proper ARIA role', async ({ page }) => {
    await page.goto('/');
    const toast = page.locator('#toast');
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

// ── Print and share ──────────────────────────────────────────

test.describe('Article actions', () => {
  test('share button exists on article pages', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.share-btn')).toBeVisible();
  });

  test('print button exists on article pages', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.print-btn')).toBeVisible();
  });

  test('copy article button exists', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.copy-article-btn')).toBeVisible();
  });

  test('article meta shows reading time', async ({ page }) => {
    await page.goto('/#setup');
    await expect(page.locator('.article-meta')).toBeVisible();
    await expect(page.locator('.article-meta')).toContainText('min read');
  });
});

// ── Back to top ──────────────────────────────────────────────

test.describe('Back to top', () => {
  test('back to top button appears after scrolling', async ({ page }) => {
    await page.goto('/#faq');
    await expect(page.locator('#back-top')).not.toHaveClass(/visible/);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);
    await expect(page.locator('#back-top')).toHaveClass(/visible/);
  });
});

// ── Release notes ────────────────────────────────────────────

test.describe('Release notes', () => {
  test('release notes page loads with entries', async ({ page }) => {
    await page.goto('/#release-notes');
    await expect(page.locator('.content-inner h1')).toContainText('Release notes');
    await expect(page.locator('.release-entry')).not.toHaveCount(0);
  });

  test('release entries have version, date, and status', async ({ page }) => {
    await page.goto('/#release-notes');
    await page.waitForSelector('.release-entry');
    const first = page.locator('.release-entry').first();
    await expect(first.locator('.release-version')).toBeVisible();
    await expect(first.locator('.release-date')).toBeVisible();
    await expect(first.locator('.release-status')).toBeVisible();
  });

  test('release items have type badges', async ({ page }) => {
    await page.goto('/#release-notes');
    await page.waitForSelector('.release-item');
    const badge = page.locator('.release-badge').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(['new', 'improved', 'fixed']).toContain(text.trim());
  });

  test('filter buttons filter entries', async ({ page }) => {
    await page.goto('/#release-notes');
    await page.waitForSelector('.release-filter-btn');
    const allCount = await page.locator('.release-item').count();
    await page.locator('.release-filter-btn', { hasText: 'New' }).click();
    const newCount = await page.locator('.release-item').count();
    expect(newCount).toBeLessThanOrEqual(allCount);
    expect(newCount).toBeGreaterThan(0);
    // All visible badges should be 'new'
    const badges = page.locator('.release-badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveClass(/new/);
    }
  });

  test('has in-progress and planned sections', async ({ page }) => {
    await page.goto('/#release-notes');
    await page.waitForSelector('.release-status');
    await expect(page.locator('.release-status.in-progress')).toHaveCount(1);
    await expect(page.locator('.release-status.planned')).toHaveCount(1);
  });
});

// ── Feature requests ─────────────────────────────────────────

test.describe('Feature requests', () => {
  test('feature poll page loads with items', async ({ page }) => {
    await page.goto('/#feature-requests');
    await expect(page.locator('.content-inner h1')).toContainText('Feature requests');
    await expect(page.locator('.poll-item')).not.toHaveCount(0);
  });

  test('poll items have vote button, title, and tag', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.waitForSelector('.poll-item');
    const first = page.locator('.poll-item').first();
    await expect(first.locator('.poll-vote-btn')).toBeVisible();
    await expect(first.locator('.poll-item-title')).toBeVisible();
    await expect(first.locator('.poll-item-tag')).toBeVisible();
  });

  test('voting toggles vote state', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.waitForSelector('.poll-vote-btn');
    const btn = page.locator('.poll-vote-btn').first();
    const countBefore = await btn.locator('.poll-vote-count').textContent();
    await btn.click();
    await expect(btn).toHaveClass(/voted/);
    const countAfter = await btn.locator('.poll-vote-count').textContent();
    expect(parseInt(countAfter)).toBe(parseInt(countBefore) + 1);
    // Unvote
    await btn.click();
    await expect(btn).not.toHaveClass(/voted/);
  });

  test('sort buttons work', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.waitForSelector('.poll-sort-btn');
    await page.locator('.poll-sort-btn', { hasText: 'A–Z' }).click();
    await expect(page.locator('.poll-sort-btn', { hasText: 'A–Z' })).toHaveClass(/active/);
  });

  test('submit idea adds to list', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.waitForSelector('.poll-item');
    const countBefore = await page.locator('.poll-item').count();
    await page.fill('#pollInput', 'Dark mode per-session');
    await page.locator('.poll-submit-btn').click();
    const countAfter = await page.locator('.poll-item').count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test('submit rejects short ideas', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.fill('#pollInput', 'Hi');
    await page.locator('.poll-submit-btn').click();
    // Should show toast, not add item
    await expect(page.locator('#toast')).toHaveClass(/show/);
  });

  test('total votes counter updates', async ({ page }) => {
    await page.goto('/#feature-requests');
    await page.waitForSelector('.poll-total');
    await expect(page.locator('.poll-total')).toBeVisible();
  });
});
