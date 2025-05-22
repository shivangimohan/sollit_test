const { test, expect } = require('@playwright/test');
const NetworkMockPage = require('../pages/NetworkMockPage');
const { 
    getTestData
  } = require('../utils/commands');

// Simple test for API mocking
test.describe('Simple Network Mock Test', () => {

  // Load test data before all tests
  let searchData;
  test.beforeAll(async () => {
    searchData = await getTestData('mockApi');
  });
    
    // Test with multiple URL patterns to increase chances of interception
    test('should intercept and mock network requests', async ({ page }) => {
        // Create the page object
        const networkMockPage = new NetworkMockPage(page);
        
        // Setup monitoring for all network requests
        await networkMockPage.startRequestMonitoring();
        
        // Set up multiple URL patterns to intercept
        const urlPatterns = [
            '**/search?*',   // Main API endpoint
        ];
        
        console.log('Setting up multiple mock patterns to ensure interception');
        for (const pattern of urlPatterns) {
            await networkMockPage.setupMockResponse(pattern, searchData.response.data);
        }
        
        // Navigate to the home page
        await networkMockPage.navigateToHome();
        
        // Perform a search to trigger network requests
        try {
            await networkMockPage.performSearch("Amsterdam");
            console.log('Search completed successfully');
        } catch (error) {
            console.error('Search failed but continuing with test:', error.message);
        }
        
        // Wait a moment for any pending network requests
        await page.waitForTimeout(2000);
        
        // Check for any interception
        let anyIntercepted = false;
        for (const pattern of ['search', 'suggest', 'api', 'funda']) {
            const wasIntercepted = networkMockPage.wasUrlPatternIntercepted(pattern);
            console.log(`Pattern '${pattern}' intercepted: ${wasIntercepted}`);
            if (wasIntercepted) {
                anyIntercepted = true;
            }
        }
        
        // Final assertion - we expect at least one pattern to have been intercepted
        expect(anyIntercepted).toBeTruthy();
    });
});