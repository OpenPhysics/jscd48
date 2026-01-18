import { test, expect } from '@playwright/test';

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText('Skip to main content');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for banner (header)
    const banner = page.locator('[role="banner"]');
    await expect(banner).toBeVisible();

    // Check for navigation
    const nav = page.locator('[role="tablist"]');
    await expect(nav).toBeVisible();

    // Check for main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('id', 'main-content');

    // Check for contentinfo (footer)
    const footer = page.locator('[role="contentinfo"]');
    await expect(footer).toBeVisible();
  });

  test('should have ARIA labels on interactive elements', async ({ page }) => {
    const connectBtn = page.locator('#connectBtn');
    await expect(connectBtn).toHaveAttribute('aria-label');

    const clearBtn = page.locator('#clearBtn');
    await expect(clearBtn).toHaveAttribute('aria-label');

    const triggerSlider = page.locator('#triggerSlider');
    await expect(triggerSlider).toHaveAttribute('aria-label');

    const dacSlider = page.locator('#dacSlider');
    await expect(dacSlider).toHaveAttribute('aria-label');
  });

  test('should have ARIA live regions for dynamic content', async ({
    page,
  }) => {
    const statusText = page.locator('#statusText');
    await expect(statusText).toHaveAttribute('aria-live', 'polite');

    const browserWarning = page.locator('#browserWarning');
    await expect(browserWarning).toHaveAttribute('aria-live', 'polite');
  });

  test('should have proper tab roles and states', async ({ page }) => {
    const monitorTab = page.locator('#monitor-tab');
    const trackingTab = page.locator('#tracking-tab');

    await expect(monitorTab).toHaveAttribute('role', 'tab');
    await expect(trackingTab).toHaveAttribute('role', 'tab');

    await expect(monitorTab).toHaveAttribute('aria-selected', 'true');
    await expect(trackingTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should have associated labels for form controls', async ({ page }) => {
    // Trigger Level
    await expect(page.locator('#triggerSlider')).toBeVisible();
    const triggerLabel = page.locator('label[for="triggerSlider"]');
    await expect(triggerLabel).toBeVisible();
    await expect(triggerLabel).toHaveText('Trigger Level');

    // Impedance
    await expect(page.locator('#impedanceSelect')).toBeVisible();
    const impedanceLabel = page.locator('label[for="impedanceSelect"]');
    await expect(impedanceLabel).toBeVisible();
    await expect(impedanceLabel).toHaveText('Impedance');

    // DAC Output
    await expect(page.locator('#dacSlider')).toBeVisible();
    const dacLabel = page.locator('label[for="dacSlider"]');
    await expect(dacLabel).toBeVisible();
    await expect(dacLabel).toHaveText('DAC Output');
  });

  test('should navigate with keyboard (Tab)', async ({ page }) => {
    // Start at the beginning
    await page.keyboard.press('Tab');

    // Skip link should be focused
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    // Continue tabbing
    await page.keyboard.press('Tab');

    // Connect button should be focused
    const connectBtn = page.locator('#connectBtn');
    await expect(connectBtn).toBeFocused();
  });

  test('should activate skip link with keyboard', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Main content should be in viewport
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have focus indicators visible', async ({ page }) => {
    const connectBtn = page.locator('#connectBtn');
    await connectBtn.focus();

    // Check that element is focused
    await expect(connectBtn).toBeFocused();

    // Get computed style to verify focus outline exists
    const outlineWidth = await connectBtn.evaluate((el) => {
      return window.getComputedStyle(el, ':focus-visible').outlineWidth;
    });

    // Should have outline (3px as per CSS)
    expect(outlineWidth).not.toBe('0px');
  });

  test('should have channel chips with aria-pressed state', async ({
    page,
  }) => {
    const trackingTab = page.locator('#tracking-tab');
    await trackingTab.click();

    const channel0Chip = page.locator('[data-channel="0"]');
    await expect(channel0Chip).toHaveAttribute('aria-pressed', 'true');

    // Toggle
    await channel0Chip.click();
    await expect(channel0Chip).toHaveAttribute('aria-pressed', 'false');
  });

  test('should have semantic HTML headings', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h2Elements = page.locator('h2');
    const count = await h2Elements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have external links with rel=noopener', async ({ page }) => {
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('should support keyboard navigation through sliders', async ({
    page,
  }) => {
    const triggerSlider = page.locator('#triggerSlider');
    await triggerSlider.focus();

    const initialValue = await triggerSlider.inputValue();

    // Use arrow keys to change value
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    const newValue = await triggerSlider.inputValue();
    expect(parseInt(newValue)).toBeGreaterThan(parseInt(initialValue));
  });

  test('should have proper tabpanel roles', async ({ page }) => {
    const monitorPanel = page.locator('#monitorTab');
    const trackingPanel = page.locator('#trackingTab');

    await expect(monitorPanel).toHaveAttribute('role', 'tabpanel');
    await expect(trackingPanel).toHaveAttribute('role', 'tabpanel');
  });

  test('should have sections with labelledby attributes', async ({ page }) => {
    const controlsSection = page.locator(
      'section[aria-labelledby="controls-heading"]'
    );
    await expect(controlsSection).toBeVisible();

    const heading = page.locator('#controls-heading');
    await expect(heading).toHaveText('Controls');
  });
});
