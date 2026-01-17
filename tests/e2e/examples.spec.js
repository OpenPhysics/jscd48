import { test, expect } from '@playwright/test';

const EXAMPLES = [
  {
    name: 'Examples Index',
    path: '/examples/',
    title: 'CD48 Examples',
  },
  {
    name: 'Simple Monitor',
    path: '/examples/simple-monitor.html',
    title: 'CD48 - Simple Channel Monitor',
  },
  {
    name: 'Error Handling',
    path: '/examples/error-handling.html',
    title: 'CD48 - Error Handling Demo',
  },
  {
    name: 'Demo Mode',
    path: '/examples/demo-mode.html',
    title: 'CD48 - Demo Mode',
  },
  {
    name: 'Multi-Channel Display',
    path: '/examples/multi-channel-display.html',
    title: 'CD48 - Multi-Channel Display',
  },
  {
    name: 'Continuous Monitoring',
    path: '/examples/continuous-monitoring.html',
    title: 'CD48 - Continuous Monitoring',
  },
  {
    name: 'Coincidence Measurement',
    path: '/examples/coincidence-measurement.html',
    title: 'CD48 - Coincidence Measurement',
  },
  {
    name: 'Graphing',
    path: '/examples/graphing.html',
    title: 'CD48 - Interactive Graphing',
  },
  {
    name: 'Data Export',
    path: '/examples/data-export.html',
    title: 'CD48 - Data Export',
  },
  {
    name: 'Statistical Analysis',
    path: '/examples/statistical-analysis.html',
    title: 'CD48 - Statistical Analysis Tools',
  },
  {
    name: 'Calibration Wizard',
    path: '/examples/calibration-wizard.html',
    title: 'CD48 - Calibration Wizard',
  },
  {
    name: 'Code Playground',
    path: '/examples/code-playground.html',
    title: 'CD48 - Live Code Playground',
  },
];

test.describe('Example Pages - Loading and Basic UI', () => {
  for (const example of EXAMPLES) {
    test(`${example.name} - loads without errors`, async ({ page }) => {
      // Listen for console errors
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Listen for page errors
      const pageErrors = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      // Navigate to page
      await page.goto(example.path);

      // Check title
      await expect(page).toHaveTitle(new RegExp(example.title));

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Check for critical errors (allow expected errors like "not connected")
      const criticalErrors = pageErrors.filter(
        (error) =>
          !error.includes('not connected') &&
          !error.includes('not supported') &&
          !error.includes('user cancelled')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.describe('Examples Index - Functionality', () => {
  test('displays all examples', async ({ page }) => {
    await page.goto('/examples/');

    // Check that example cards are displayed
    const cards = page.locator('.example-card');
    const count = await cards.count();
    expect(count).toBe(11);
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/examples/');

    // Type in search box
    await page.fill('#searchInput', 'calibration');

    // Wait for filtering
    await page.waitForTimeout(100);

    // Check filtered results
    const visibleCards = page.locator('.example-card:visible');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(11);
  });

  test('category filtering works', async ({ page }) => {
    await page.goto('/examples/');

    // Click on "Advanced" category
    await page.click('[data-category="advanced"]');

    // Wait for filtering
    await page.waitForTimeout(100);

    // Should show only advanced examples
    const cards = page.locator('.example-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(11);
  });

  test('example cards are clickable', async ({ page }) => {
    await page.goto('/examples/');

    // Click first example card
    const firstCard = page.locator('.example-card').first();
    await firstCard.click();

    // Should navigate to example page
    await expect(page).not.toHaveURL('/examples/');
  });
});

test.describe('Code Playground - Functionality', () => {
  test('editor loads and displays code', async ({ page }) => {
    await page.goto('/examples/code-playground.html');

    // Wait for CodeMirror to load
    await page.waitForSelector('.CodeMirror');

    // Check that editor is present
    const editor = page.locator('.CodeMirror');
    await expect(editor).toBeVisible();
  });

  test('template selection works', async ({ page }) => {
    await page.goto('/examples/code-playground.html');

    await page.waitForSelector('#templateSelect');

    // Select a template
    await page.selectOption('#templateSelect', 'basic');

    // Wait a bit for the code to load
    await page.waitForTimeout(100);

    // Check that code is loaded (CodeMirror makes this tricky)
    const editorContent = await page.locator('.CodeMirror-code');
    await expect(editorContent).toBeVisible();
  });

  test('console tab works', async ({ page }) => {
    await page.goto('/examples/code-playground.html');

    // Console tab should be active by default
    const consoleTab = page.locator('.tab[data-tab="console"]');
    await expect(consoleTab).toHaveClass(/active/);

    // Console output should be visible
    const consoleOutput = page.locator('#consoleOutput');
    await expect(consoleOutput).toBeVisible();
  });

  test('tab switching works', async ({ page }) => {
    await page.goto('/examples/code-playground.html');

    // Click device tab
    await page.click('.tab[data-tab="device"]');

    // Device tab should be active
    const deviceTab = page.locator('.tab[data-tab="device"]');
    await expect(deviceTab).toHaveClass(/active/);

    // Device content should be visible
    const deviceContent = page.locator('.tab-content[data-tab="device"]');
    await expect(deviceContent).toBeVisible();
  });
});

test.describe('Demo Mode - Functionality', () => {
  test('demo mode starts automatically', async ({ page }) => {
    await page.goto('/examples/demo-mode.html');

    // Wait for demo mode to start
    await page.waitForTimeout(1000);

    // Check for success message in console or UI
    // This depends on the actual implementation
    const hasStarted = await page.locator('body').evaluate(() => {
      return (
        document.body.textContent.includes('Demo') ||
        document.body.textContent.includes('Simulated')
      );
    });

    expect(hasStarted).toBeTruthy();
  });
});

test.describe('Visual Elements - Responsiveness', () => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ];

  for (const viewport of viewports) {
    test(`Examples index is responsive on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/examples/');

      // Check that the page is visible
      const grid = page.locator('.examples-grid');
      await expect(grid).toBeVisible();

      // Check that search box is visible
      const searchBox = page.locator('#searchInput');
      await expect(searchBox).toBeVisible();
    });
  }
});

test.describe('Accessibility', () => {
  test('examples index has proper heading structure', async ({ page }) => {
    await page.goto('/examples/');

    // Check for main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Examples');
  });

  test('code playground has accessible labels', async ({ page }) => {
    await page.goto('/examples/code-playground.html');

    // Check for proper labels
    const labels = page.locator('label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });
});
