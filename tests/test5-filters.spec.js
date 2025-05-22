const { test, expect } = require('@playwright/test');
const { 
  getTestData,
  initializePages
} = require('../utils/commands');
const path = require('path');
const ensureLoggedIn = require('../utils/ensureLoggedIn');

test.describe('Test 5: List View Filter Tests', () => {
    // Load test data before all tests
    let searchData;
    const stateFilePath = path.resolve(__dirname, '../state.json');

    test.beforeAll(async () => {
      searchData = await getTestData('filters');
    });

    test.beforeEach(async ({ page, browser }) => {
        // Use the same pattern as other tests by checking login status first
        const loggedIn = await ensureLoggedIn(page);
        
        // If unable to log in, skip the test
        if (!loggedIn) {
          test.skip();
        }
    });

    test('should filter properties using price, living area and keyword', async ({ page }) => {
        // Initialize pages using the common utility to maintain consistency
        const { listingDetailsPage } = initializePages(page, { useMainSite: true });
        
        // Navigate to list view
        await listingDetailsPage.navigateToListView();
        
        // Apply filters
        await listingDetailsPage.setPriceFilter(
            searchData.price.min,
            searchData.price.max
        );
        
        await listingDetailsPage.setLivingAreaFilter(
            searchData.livingArea.min,
            searchData.livingArea.max
        );
        
        // Add keyword filter - use "tuin" from the keywords array 
        await listingDetailsPage.setKeywordFilter(searchData.keywords[1]); // "tuin" is at index 1 in test-data.json
        
        // Verify filters are applied
        const filteredUrl = await listingDetailsPage.verifyFilteredResults();
        // For debugging
        console.log('Filtered URL:', filteredUrl);
        
        // Create the expected encoded values
        const expectedPrice = `price=%22${searchData.price.min}-${searchData.price.max}%22`;
        const expectedFloorArea = `floor_area=%22${searchData.livingArea.min}-${searchData.livingArea.max}%22`;
        const expectedExteriorSpace = 'exterior_space_type=[%22garden%22]';
        const expectedArea = 'selected_area=[%22nl%22]';
        
        // Verify each encoded parameter
        expect(filteredUrl).toContain(expectedPrice);
        expect(filteredUrl).toContain(expectedFloorArea);
        expect(filteredUrl).toContain(expectedExteriorSpace);
        expect(filteredUrl).toContain(expectedArea);
        
        // Verify we have search results
        const resultsCount = await listingDetailsPage.getSearchResults();
        expect(resultsCount).toBeGreaterThan(0);
    });
});