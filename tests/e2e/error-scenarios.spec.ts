import { test, expect } from '@playwright/test';

/**
 * Error Scenario Tests
 * Tests error handling in the UI when various errors occur
 */

test.describe('Error Scenarios - User Interface', () => {
  test('code playground - handles syntax errors gracefully', async ({
    page,
  }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');

    // Inject invalid code
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.CodeMirror');
      if (editors.length > 0) {
        const cm = editors[0].CodeMirror;
        cm.setValue('this is invalid javascript code {{{');
      }
    });

    // Try to run the code
    await page.click('#runBtn');

    // Wait for error to appear in console
    await page.waitForTimeout(500);

    // Check that error is displayed
    const consoleOutput = page.locator('#consoleOutput');
    const hasError = await consoleOutput.evaluate((el) => {
      return (
        el.textContent.includes('error') || el.textContent.includes('Error')
      );
    });

    expect(hasError).toBeTruthy();
  });

  test('code playground - displays runtime errors', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');

    // Inject code that will throw runtime error
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.CodeMirror');
      if (editors.length > 0) {
        const cm = editors[0].CodeMirror;
        cm.setValue('throw new Error("Test error");');
      }
    });

    // Run the code
    await page.click('#runBtn');
    await page.waitForTimeout(500);

    // Check for error in console
    const consoleOutput = page.locator('#consoleOutput');
    const text = await consoleOutput.textContent();
    expect(text).toContain('Test error');
  });

  test('examples index - handles missing examples gracefully', async ({
    page,
  }) => {
    await page.goto('/examples/');

    // Try to navigate to non-existent example
    await page.goto('/examples/nonexistent.html');

    // Should show 404 or error page
    const statusCode = await page.evaluate(() => {
      return (
        document.title.includes('404') ||
        document.body.textContent.includes('not found')
      );
    });

    // We expect some kind of error indication
    expect(statusCode).toBeTruthy();
  });

  test('search with no results shows message', async ({ page }) => {
    await page.goto('/examples/');

    // Search for something that doesn't exist
    await page.fill('#searchInput', 'xyz123nonexistent');
    await page.waitForTimeout(200);

    // Should show "no examples found" message
    const grid = page.locator('.examples-grid');
    const text = await grid.textContent();
    expect(text.toLowerCase()).toContain('no examples found');
  });
});

test.describe('Error Scenarios - Network Failures', () => {
  test('handles slow network gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/examples/');

    // Page should still load eventually
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Error Scenarios - JavaScript Errors', () => {
  test('catches and displays unhandled errors in dev mode', async ({
    page,
  }) => {
    // Navigate to code playground which has dev mode enabled
    await page.goto('/examples/code-playground.html');

    // Inject dev-utils
    await page.waitForTimeout(500);

    // Trigger an unhandled error
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Unhandled test error');
      }, 100);
    });

    // Wait for error to be caught
    await page.waitForTimeout(500);

    // Check if error overlay appears (if dev mode is enabled)
    const hasErrorOverlay = await page.evaluate(() => {
      return document.getElementById('dev-error-overlay') !== null;
    });

    // Error should be caught by dev mode
    expect(hasErrorOverlay).toBeTruthy();
  });

  test('handles console errors without crashing', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/examples/code-playground.html');

    // Trigger console error
    await page.evaluate(() => {
      console.error('Test console error');
    });

    await page.waitForTimeout(200);

    // Page should still be functional
    const isVisible = await page.locator('h1').isVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe('Error Scenarios - User Input Validation', () => {
  test('code playground - handles empty code execution', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');

    // Clear the editor
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.CodeMirror');
      if (editors.length > 0) {
        const cm = editors[0].CodeMirror;
        cm.setValue('');
      }
    });

    // Try to run empty code
    await page.click('#runBtn');
    await page.waitForTimeout(300);

    // Should show warning message
    const consoleOutput = page.locator('#consoleOutput');
    const text = await consoleOutput.textContent();
    expect(text.toLowerCase()).toContain('no code');
  });

  test('search input - handles special characters', async ({ page }) => {
    await page.goto('/examples/');

    // Type special characters
    await page.fill('#searchInput', '<script>alert("test")</script>');
    await page.waitForTimeout(200);

    // Page should still be functional and not execute script
    const hasAlert = await page.evaluate(() => {
      return document.body.innerHTML.includes('alert');
    });

    // Should not contain raw script tag
    expect(hasAlert).toBeFalsy();
  });
});

test.describe('Error Scenarios - Browser Compatibility', () => {
  test('shows appropriate message for missing Web Serial API', async ({
    page,
  }) => {
    // Override Web Serial API support
    await page.addInitScript(() => {
      delete navigator.serial;
    });

    await page.goto('/examples/simple-monitor.html');

    // Should show warning or error about unsupported browser
    const hasWarning = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      return text.includes('not supported') || text.includes('browser');
    });

    expect(hasWarning).toBeTruthy();
  });
});

test.describe('Error Scenarios - Data Validation', () => {
  test('handles invalid template selection gracefully', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('#templateSelect');

    // Try to set invalid template
    await page.evaluate(() => {
      document.getElementById('templateSelect').value = 'nonexistent';
      document
        .getElementById('templateSelect')
        .dispatchEvent(new Event('change'));
    });

    await page.waitForTimeout(200);

    // Editor should remain functional
    const editor = page.locator('.CodeMirror');
    await expect(editor).toBeVisible();
  });
});

test.describe('Error Scenarios - Recovery', () => {
  test('code playground - clears errors when new code is run', async ({
    page,
  }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('.CodeMirror');

    // Run code that causes error
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.CodeMirror');
      if (editors.length > 0) {
        const cm = editors[0].CodeMirror;
        cm.setValue('throw new Error("Error 1");');
      }
    });
    await page.click('#runBtn');
    await page.waitForTimeout(300);

    // Run valid code
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.CodeMirror');
      if (editors.length > 0) {
        const cm = editors[0].CodeMirror;
        cm.setValue('console.log("Success");');
      }
    });
    await page.click('#runBtn');
    await page.waitForTimeout(300);

    // Should show success message
    const consoleOutput = page.locator('#consoleOutput');
    const text = await consoleOutput.textContent();
    expect(text).toContain('Success');
  });

  test('console can be cleared after errors', async ({ page }) => {
    await page.goto('/examples/code-playground.html');
    await page.waitForSelector('#consoleOutput');

    // Add some console messages
    await page.evaluate(() => {
      console.log('Test message');
      console.error('Test error');
    });
    await page.waitForTimeout(200);

    // Clear console
    await page.click('#clearBtn');
    await page.waitForTimeout(200);

    // Console should be cleared
    const consoleOutput = page.locator('#consoleOutput');
    const text = await consoleOutput.textContent();
    expect(text.trim().length).toBeLessThan(50); // Should only have "Console cleared" message
  });
});
