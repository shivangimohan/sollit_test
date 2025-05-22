const { test, expect } = require('@playwright/test');
const { 
  searchProperty, 
  validateListingInBothViews, 
  getTestData, 
  initializePages 
} = require('../utils/commands');

// Test 3: Validate listing in different views
test.describe('Test 3: List and Card View Navigation', () => {
  
  // Load test data before all tests
  let searchData;
  test.beforeAll(async () => {
    searchData = await getTestData('search');
  });
  
  // Test for comparing the same listing across views
  test('Verify same listing appears in both views with same details', async ({ page }) => {
    // Perform a search to get some results
    const location = searchData.locations[2]; // "Rotterdam"
    
    await searchProperty(page, location);
    
    // Wait for search results to load
    const { searchResultsPage } = initializePages(page);
    await searchResultsPage.waitForSearchResults();
    
    // Verify we have enough results to check
    const resultCount = await searchResultsPage.getResultCount();
    expect(resultCount).toBeGreaterThan(0);
    
    // Check multiple listings to ensure view consistency
    const numListingsToCheck = Math.min(3, resultCount);
    
    for (let i = 0; i < numListingsToCheck; i++) {
      // Navigate between list and card views and validate the listing appears
      const validationResults = await validateListingInBothViews(page, i);
      
      // Verify the listing details match between views
      expect(validationResults.titleMatch).toBeTruthy();
      expect(validationResults.priceMatch).toBeTruthy();
      expect(validationResults.locationMatch).toBeTruthy();
      
      // Log index to verify we're checking different listings
      console.log(`Verified listing at index ${i}`);
    }
  });
});