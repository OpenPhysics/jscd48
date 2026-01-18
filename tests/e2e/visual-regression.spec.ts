import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * These tests capture screenshots and compare them against baseline images
 * Run with: npm run test:e2e -- --update-snapshots to update baselines
 */

test.describe('Visual Regression - Examples Pages', () => {
  test('examples index - initial load', async ({ page }) => {
    await page.goto('/examples/');
    await page.waitForLoadState('networkidle');

    // Wait for all images to load
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('examples-index.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('examples index - search active', async ({ page }) => {
    await page.goto('/examples/');
    await page.waitForLoadState('networkidle');

    // Type in search
    await page.fill('#searchInput', 'analysis');
    await page.waitForTimeout(200);

    // Take screenshot
    await expect(page).toHaveScreenshot('examples-index-search.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('code playground - initial state', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('code-playground-initial.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('code playground - with code', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');

    // Select a template
    await page.selectOption('#templateSelect', 'basic');
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('code-playground-with-code.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('simple monitor - initial load', async ({ page }) => {
    await page.goto('/examples/simple-monitor.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('simple-monitor.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('statistical analysis - initial load', async ({ page }) => {
    await page.goto('/examples/statistical-analysis.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('statistical-analysis.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('calibration wizard - step 1', async ({ page }) => {
    await page.goto('/examples/calibration-wizard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot of first step
    await expect(page).toHaveScreenshot('calibration-wizard-step1.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Component States', () => {
  test('examples index - hover state on card', async ({ page }) => {
    await page.goto('/examples/');
    await page.waitForLoadState('networkidle');

    // Hover over first card
    const firstCard = page.locator('.example-card').first();
    await firstCard.hover();
    await page.waitForTimeout(300);

    // Take screenshot of grid area
    await expect(page.locator('.examples-grid')).toHaveScreenshot(
      'card-hover-state.png',
      {
        animations: 'disabled',
      }
    );
  });

  test('category tag - active state', async ({ page }) => {
    await page.goto('/examples/');
    await page.waitForLoadState('networkidle');

    // Click category
    await page.click('[data-category="advanced"]');
    await page.waitForTimeout(200);

    // Take screenshot of categories
    await expect(page.locator('.categories')).toHaveScreenshot(
      'category-active-state.png',
      {
        animations: 'disabled',
      }
    );
  });
});

test.describe('Visual Regression - Responsive', () => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ];

  for (const viewport of viewports) {
    test(`examples index on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(
        `examples-index-${viewport.name}.png`,
        {
          fullPage: true,
          animations: 'disabled',
        }
      );
    });

    test(`code playground on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/examples/code-playground.html');
      await page.waitForSelector('.CodeMirror');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(
        `code-playground-${viewport.name}.png`,
        {
          fullPage: true,
          animations: 'disabled',
        }
      );
    });
  }
});

test.describe('Visual Regression - Dark Theme Consistency', () => {
  test('all pages use consistent dark theme colors', async ({ page }) => {
    const pages = [
      '/examples/',
      '/examples/code-playground.html',
      '/examples/statistical-analysis.html',
      '/examples/calibration-wizard.html',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Check background color (should be dark)
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Should be a dark color (rgb values < 50)
      const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        expect(r).toBeLessThan(50);
        expect(g).toBeLessThan(50);
        expect(b).toBeLessThan(50);
      }
    }
  });
});
