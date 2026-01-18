import { test, expect } from '@playwright/test';

test.describe('CD48 Main Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/CD48 Coincidence Counter/);
  });

  test('should display header and subtitle', async ({ page }) => {
    const header = page.locator('h1');
    await expect(header).toHaveText('CD48 Coincidence Counter');

    const subtitle = page.locator('.subtitle');
    await expect(subtitle).toContainText('Web Serial Interface');
  });

  test('should display status bar with disconnect status', async ({ page }) => {
    const statusText = page.locator('#statusText');
    await expect(statusText).toHaveText('Disconnected');

    const statusDot = page.locator('#statusDot');
    await expect(statusDot).toBeVisible();
    await expect(statusDot).not.toHaveClass(/connected/);
  });

  test('should display connect button', async ({ page }) => {
    const connectBtn = page.locator('#connectBtn');
    await expect(connectBtn).toBeVisible();
    await expect(connectBtn).toHaveText('Connect');
    await expect(connectBtn).toBeEnabled();
  });

  test('should have navigation tabs', async ({ page }) => {
    const monitorTab = page.locator('#monitor-tab');
    const trackingTab = page.locator('#tracking-tab');

    await expect(monitorTab).toBeVisible();
    await expect(trackingTab).toBeVisible();
    await expect(monitorTab).toHaveAttribute('aria-selected', 'true');
    await expect(trackingTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should switch between tabs', async ({ page }) => {
    const monitorTab = page.locator('#monitor-tab');
    const trackingTab = page.locator('#tracking-tab');
    const monitorPanel = page.locator('#monitorTab');
    const trackingPanel = page.locator('#trackingTab');

    // Initially on monitor tab
    await expect(monitorPanel).toHaveClass(/active/);
    await expect(trackingPanel).not.toHaveClass(/active/);

    // Click tracking tab
    await trackingTab.click();
    await expect(trackingTab).toHaveAttribute('aria-selected', 'true');
    await expect(monitorTab).toHaveAttribute('aria-selected', 'false');
    await expect(trackingPanel).toHaveClass(/active/);
    await expect(monitorPanel).not.toHaveClass(/active/);

    // Click back to monitor tab
    await monitorTab.click();
    await expect(monitorTab).toHaveAttribute('aria-selected', 'true');
    await expect(trackingTab).toHaveAttribute('aria-selected', 'false');
    await expect(monitorPanel).toHaveClass(/active/);
    await expect(trackingPanel).not.toHaveClass(/active/);
  });

  test('should display all 8 channel counts', async ({ page }) => {
    for (let i = 0; i < 8; i++) {
      const countValue = page.locator(`#count${i}`);
      await expect(countValue).toBeVisible();
      await expect(countValue).toHaveText('-');
    }
  });

  test('should have controls section with sliders and selects', async ({
    page,
  }) => {
    // Trigger Level slider
    const triggerSlider = page.locator('#triggerSlider');
    await expect(triggerSlider).toBeVisible();
    await expect(triggerSlider).toHaveAttribute('type', 'range');

    // Impedance select
    const impedanceSelect = page.locator('#impedanceSelect');
    await expect(impedanceSelect).toBeVisible();

    // DAC slider
    const dacSlider = page.locator('#dacSlider');
    await expect(dacSlider).toBeVisible();
    await expect(dacSlider).toHaveAttribute('type', 'range');
  });

  test('should update trigger voltage display when slider changes', async ({
    page,
  }) => {
    const triggerSlider = page.locator('#triggerSlider');
    const triggerValue = page.locator('#triggerValue');

    // Get initial value
    const initialValue = await triggerValue.textContent();

    // Change slider value
    await triggerSlider.fill('100');

    // Wait for value to update
    await page.waitForTimeout(100);

    const newValue = await triggerValue.textContent();
    expect(newValue).not.toBe(initialValue);
    expect(newValue).toContain('V');
  });

  test('should update DAC voltage display when slider changes', async ({
    page,
  }) => {
    const dacSlider = page.locator('#dacSlider');
    const dacValue = page.locator('#dacValue');

    // Get initial value
    const initialValue = await dacValue.textContent();

    // Change slider value
    await dacSlider.fill('128');

    // Wait for value to update
    await page.waitForTimeout(100);

    const newValue = await dacValue.textContent();
    expect(newValue).not.toBe(initialValue);
    expect(newValue).toContain('V');
  });

  test('should have disabled buttons when not connected', async ({ page }) => {
    const clearBtn = page.locator('#clearBtn');
    const ledBtn = page.locator('#ledBtn');
    const settingsBtn = page.locator('#settingsBtn');

    await expect(clearBtn).toBeDisabled();
    await expect(ledBtn).toBeDisabled();
    await expect(settingsBtn).toBeDisabled();
  });

  test('should display device information section', async ({ page }) => {
    const firmware = page.locator('#firmware');
    const deviceStatus = page.locator('#deviceStatus');
    const overflow = page.locator('#overflow');

    await expect(firmware).toBeVisible();
    await expect(firmware).toHaveText('-');
    await expect(deviceStatus).toHaveText('Not connected');
    await expect(overflow).toHaveText('-');
  });

  test('should display activity log', async ({ page }) => {
    const log = page.locator('#log');
    await expect(log).toBeVisible();
    await expect(log).toHaveAttribute('role', 'log');
  });

  test('should have footer with links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const links = footer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display channel selector in tracking tab', async ({ page }) => {
    const trackingTab = page.locator('#tracking-tab');
    await trackingTab.click();

    const channelSelector = page.locator('#channelSelector');
    await expect(channelSelector).toBeVisible();

    // Check for 8 channel chips
    const chips = channelSelector.locator('.channel-chip');
    const count = await chips.count();
    expect(count).toBe(8);
  });

  test('should toggle channel visibility in chart', async ({ page }) => {
    const trackingTab = page.locator('#tracking-tab');
    await trackingTab.click();

    const channel0Chip = page.locator('[data-channel="0"]');
    await expect(channel0Chip).toHaveClass(/active/);
    await expect(channel0Chip).toHaveAttribute('aria-pressed', 'true');

    // Toggle off
    await channel0Chip.click();
    await expect(channel0Chip).not.toHaveClass(/active/);
    await expect(channel0Chip).toHaveAttribute('aria-pressed', 'false');

    // Toggle back on
    await channel0Chip.click();
    await expect(channel0Chip).toHaveClass(/active/);
    await expect(channel0Chip).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display chart in tracking tab', async ({ page }) => {
    const trackingTab = page.locator('#tracking-tab');
    await trackingTab.click();

    const chart = page.locator('#rateChart');
    await expect(chart).toBeVisible();
  });

  test('should have statistics in tracking tab', async ({ page }) => {
    const trackingTab = page.locator('#tracking-tab');
    await trackingTab.click();

    const totalPoints = page.locator('#totalPoints');
    const duration = page.locator('#duration');
    const avgRate = page.locator('#avgRate');
    const peakRate = page.locator('#peakRate');

    await expect(totalPoints).toBeVisible();
    await expect(duration).toBeVisible();
    await expect(avgRate).toBeVisible();
    await expect(peakRate).toBeVisible();
  });
});
