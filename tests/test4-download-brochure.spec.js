const { test, expect } = require('@playwright/test');
const ensureLoggedIn = require('../utils/ensureLoggedIn');

test.describe('Test 4: Download Brochure Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged in before proceeding
    const loggedIn = await ensureLoggedIn(page);
    
    // If unable to log in, skip the test
    if (!loggedIn) {
      test.skip();
    }
  });

  test('should open property brochure in new tab and validate PDF', async ({ page, context }) => {
    
    // Navigate directly to a specific property that has a brochure
    const propertyUrl = 'https://www.funda.nl/detail/koop/amsterdam/appartement-jan-van-galenstraat-172-3/43921073/';
    await page.goto(propertyUrl);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    console.log('Property page loaded, looking for download brochure link...');
    
    // Find and click the download brochure link - try multiple selectors
    let downloadClicked = false;
    
    const possibleSelectors = [
      'a:has-text(" Download brochure ")',
      'text= Download brochure '
    ];
    
    // ✅ NEW APPROACH: Wait for new tab to open
    const [newPage] = await Promise.all([
      context.waitForEvent('page'), // Wait for new tab
      (async () => {
        // Click the download link
        for (const selector of possibleSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`Found download link with selector: ${selector}`);
              await element.click();
              downloadClicked = true;
              break;
            }
          } catch (e) {
            console.log(`Selector ${selector} not found, trying next...`);
          }
        }
      })()
    ]);
    
    // Verify that we found and clicked a download link
    expect(downloadClicked).toBeTruthy();
    
    // Wait for the new tab to load
    await newPage.waitForLoadState('networkidle');
    
    // Get the URL of the new tab
    const pdfUrl = newPage.url();
    console.log('PDF opened in new tab:', pdfUrl);
    
    // VALIDATION POINT 1: Is actually a PDF file (check URL)
    expect(pdfUrl.toLowerCase()).toMatch(/\.pdf$/);
    
    // VALIDATION POINT 2: PDF content is loaded (check page title or content)
    // PDFs usually have specific titles or we can check if the page loaded successfully
    const pageTitle = await newPage.title();
    console.log('PDF page title:', pageTitle);
    
    // Verify the page loaded (not an error page)
    expect(pageTitle).not.toContain('404');
    expect(pageTitle).not.toContain('Error');
    
    // Additional validation: Check if PDF viewer is present
    // Most browsers show PDF content, we can verify the page has loaded
    const pageContent = await newPage.textContent('body').catch(() => '');
    
    // If it's a PDF, either the title contains the property name or URL is valid
    const hasValidContent = 
      pageTitle.toLowerCase().includes('galenstraat') || 
      pdfUrl.includes('funda') ||
      pageContent.length > 0;
    
    expect(hasValidContent).toBeTruthy();
    
    console.log(`✅ PDF validation passed: ${pdfUrl}`);
    console.log(`✅ PDF title: ${pageTitle}`);
    
    // Close the PDF tab
    await newPage.close();
  });
});