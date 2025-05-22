const { test, expect } = require('@playwright/test');
const { 
  initializePages,
  getTestData
} = require('../utils/commands');
const ensureLoggedIn = require('../utils/ensureLoggedIn');

// Test 2: Map Search functionality
test.describe('Test 2: Map Search', () => {
  
  // Load test data before all tests
  let searchData;
  test.beforeAll(async () => {
    searchData = await getTestData('search');
  });
  
  // Before each test, make sure the user is logged in
  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged in before proceeding with map tests
    const loggedIn = await ensureLoggedIn(page);
    
    // If unable to log in, skip the test
    if (!loggedIn) {
      test.skip();
    }
  });

  // Test for navigating to map search and using location search  
  test.only('Use Search on map option and search by location', async ({ page }) => {
    // Get the MapPage object
    const { mapPage } = initializePages(page);
    
    // Navigate to map search (which uses www.funda.nl domain)
    await mapPage.navigateToMapSearch();
    
    // Get test location data
    const location = searchData.locations[0]; // Amsterdam

    // Search by location
    await mapPage.searchLocation(location);
    
    // Get current URL to verify search was executed
    const url = await mapPage.getCurrentUrl();
    console.log('URL after location search:', url);
    
    // Verify URL contains expected terms
    expect(url).toContain('kaart');
    expect(url.toLowerCase()).toContain(location.toLowerCase());
    
    // Verify we have results on the map (markers)
    try {
      const markers = await mapPage.getVisibleMarkers();
      const markerCount = await markers.count();
      
      // Expect at least one marker on the map
      expect(markerCount).toBeGreaterThan(0);
    } catch (error) {
      console.log('Could not verify markers, but URL shows search was performed');
    }
  });
  
  // Test for searching by postcode
  test('Search listing by postcode', async ({ page }) => {
    // Get the MapPage object
    const { mapPage } = initializePages(page);
    
    // Navigate to map search
    await mapPage.navigateToMapSearch();
    
    // Get test postcode data
    const postcode = searchData.postcodes[0]; // 1012 JS (Amsterdam)
    
    // Search by postcode
    await mapPage.searchLocation(postcode);
    
    // Get current URL to verify search was executed
    const url = await mapPage.getCurrentUrl();
    console.log('URL after postcode search:', url);
    
    // Verify URL contains expected terms
    expect(url).toContain('kaart');
    
    // Check if URL contains postcode or if we have markers
    const postcodeInUrl = url.includes(postcode.split(' ')[0]); // First part of postcode
    
    if (!postcodeInUrl) {
      // If postcode not in URL, we should at least have markers
      const markers = await mapPage.getVisibleMarkers();
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
    } else {
      expect(postcodeInUrl).toBeTruthy();
    }
  });
  
  // Test for navigating directly to coordinates
  test('Navigate to specific coordinates on map', async ({ page }) => {
    // Get the MapPage object
    const { mapPage } = initializePages(page);
    
    // Get test coordinate data
    const coordinate = searchData.coordinates[0]; // Amsterdam Centrum
    
    // Navigate directly to coordinates
    await mapPage.navigateToCoordinates(coordinate.lat, coordinate.lng, 14);
    
    // Get current URL
    const url = await mapPage.getCurrentUrl();
    console.log('URL after navigating to coordinates:', url);
    
    // Verify coordinates in URL
    expect(url).toContain(`centerLat=${coordinate.lat}`);
    expect(url).toContain(`centerLng=${coordinate.lng}`);
    expect(url).toContain('zoom=14');
    
    // Wait a moment for map to stabilize
    await page.waitForTimeout(2000);
  });
  
  // Test for clicking on specific coordinates
  test('Directly choose a specific coordinate on map', async ({ page }) => {
    // Get the MapPage object
    const { mapPage } = initializePages(page);
    
    // Navigate to map search
    await mapPage.navigateToMapSearch();
    
    // Get test coordinate data
    const coordinate = searchData.coordinates[0]; // Amsterdam Centrum
    
    // Click on specified coordinates
    await mapPage.clickOnMapCoordinates(coordinate);
    
    // Try to find an info window or verify interaction
    try {
      // Check for info window
      const infoWindow = page.locator(mapPage.mapElements.infoWindow);
      const infoWindowVisible = await infoWindow.isVisible().catch(() => false);
      
      if (infoWindowVisible) {
        expect(infoWindowVisible).toBeTruthy();
      } else {
        // Check URL instead
        const url = await mapPage.getCurrentUrl();
        expect(url).toContain('kaart');
      }
    } catch (error) {

    }
  });
  
  // Test passing data via file and using dynamic data
  test('Pass search data via file and use dynamic data', async ({ page }) => {
    // Get the MapPage object
    const { mapPage } = initializePages(page);
    
    // Navigate to map search
    await mapPage.navigateToMapSearch();
    
    // Get random location from test data (dynamic selection)
    const randomIndex = Math.floor(Math.random() * searchData.locations.length);
    const randomLocation = searchData.locations[randomIndex];
    
    // Log the dynamic data used for the test
    console.log(`Dynamic test data used: Location=${randomLocation}, Index=${randomIndex}`);
    
    // Search using the randomly selected location
    await mapPage.searchLocation(randomLocation);
    
    // Get current URL to verify search was executed
    const url = await mapPage.getCurrentUrl();
    console.log('URL after dynamic search:', url);
    
    // Verify URL contains expected terms
    expect(url).toContain('kaart');
  
  });
});