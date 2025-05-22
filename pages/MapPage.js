const BasePage = require('./BasePage');

/**
 * Page object for the Map Search functionality
 */
class MapPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {
    // Initialize with main site domain option
    super(page, { domain: 'https://www.funda.nl' });
    
    // Define selectors specific to map page
    this.mapElements = {
      mapContainer: 'div[id="map"], div[componentid="map_results"] ',
      markers: 'div[data-test-id="map-container"] img',
      infoWindow: 'div[data-test-id="map-info-window"]',
      zoomInButton: 'button[aria-label="Zoom in"]',
      zoomOutButton: 'button[aria-label="Zoom out"]',
      
      // Updated selectors based on MapSearchPage
      searchBox: 'div[data-testid="searchBoxSuggestions-mobile"]',
      searchBoxInput: 'input[id="SearchBox-input"], input[data-testid="search-box"]',
      searchSuggestions: '//ul[contains(@class,"suggestion-list")]',
      searchResults: '[data-test-id="search-box-list-item"]',
      
      // Keep original selectors as fallbacks
      searchBoxFallback: 'div[data-test-id="search-box-button"]',
      searchButtonFallback: 'button[data-test-id="map-search-button"]',
      
      // Postcode search
      postcodeSearch: 'input[placeholder*="Zoek op postcode"]'
    };
    
    this.filters = {
      filterButton: 'button[data-test-id="search-filters-button"]',
      priceMin: 'select[name="filter_KoopprijsVan"]',
      priceMax: 'select[name="filter_KoopprijsTot"]',
      livingAreaMin: 'select[name="filter_WoonOppervlakteVan"]',
      livingAreaMax: 'select[name="filter_WoonOppervlakteTot"]',
      applyButton: 'button[data-interaction-id="search-filters-apply"]'
    };
  }

  /**
   * Navigate to map search
   * @returns {Promise<void>}
   */
  async navigateToMapSearch() {
    // Use the main site domain for map search
    await this.navigate('zoeken/kaart/koop', { useMainSite: true });
    
    // Check if we're logged in before proceeding
    const isLoggedIn = await this.isLoggedIn();
    console.log(`User logged in status before map search: ${isLoggedIn}`);
    
    // Wait for the map container
    await this.waitForElement(this.mapElements.mapContainer);
    
    // Handle CAPTCHA if it appears
    // await this.handlePossibleCaptcha({ 
    //   returnPath: 'zoeken/kaart/koop',
    //   useMainSite: true
    // });
  }

  /**
   * Navigate directly to specific coordinates on the map
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} zoom - Zoom level (default: 10)
   * @returns {Promise<void>}
   */
  async navigateToCoordinates(latitude, longitude, zoom = 10) {
    const url = `zoeken/kaart/koop?selected_area=["nl"]&zoom=${zoom}&centerLat=${latitude}&centerLng=${longitude}`;
    await this.navigate(url, { useMainSite: true });
    
    // Wait for the map to load
    await this.waitForMapLoad();
  }

  /**
   * Wait for map to be fully loaded
   * @returns {Promise<void>}
   */
  async waitForMapLoad() {
    // Wait for the map container
    await this.waitForElement(this.mapElements.mapContainer);
    
    // Wait for markers to appear, which indicates map data has loaded
    try {
      await this.page.waitForSelector(this.mapElements.markers, { 
        state: 'visible',
        timeout: 10000
      });
    } catch (e) {
      console.log('Map markers did not appear, map might not have loaded property listings yet');
    }
    
    // Wait a moment for any animations to finish
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for location on map
   * @param {string} location - Location to search for
   * @returns {Promise<void>}
   */
  async searchLocation(location) {
    console.log(`Searching for location: ${location}`);
    
    // Try to find and click the search box
    let searchBoxVisible = false;
    
    // Try the primary selector first
    try {
      searchBoxVisible = await this.page.locator(this.mapElements.searchBox).isVisible({ timeout: 5000 });
    } catch (e) {
      console.log('Primary search box not found, trying fallback');
    }
    
   await this.page.locator(this.mapElements.searchBox).click();
    
    // Wait for the input field to appear and be clickable
    console.log('Waiting for search input field to be visible');
    await this.page.waitForSelector(this.mapElements.searchBoxInput, { state: 'visible', timeout: 10000 });
    
    // Clear the input field and type the location
    await this.page.locator(this.mapElements.searchBoxInput).first().fill('');
    console.log('Typing search term:', location);
    await this.page.locator(this.mapElements.searchBoxInput).first().fill(location);
    
    // Wait for suggestions to appear
    console.log('Waiting for search suggestions to appear');
    try {
      // First try to use the XPath selector for the suggestions
      await this.page.waitForSelector(this.mapElements.searchSuggestions, { timeout: 10000 });
      
      
      // Click on the first suggestion that contains our location
      console.log('Clicking suggestion that matches:', location);
      
      // Using an XPath selector to find the suggestion containing our location text
      const suggestionXPath = `${this.mapElements.searchSuggestions}//li[contains(., "${location}")]`;
      
      // Check if any matching suggestions exist
      const hasSuggestions = await this.page.locator(suggestionXPath).count() > 0;
      
      if (hasSuggestions) {
        // Click on the first matching suggestion
        await this.page.locator(suggestionXPath).first().click();
        console.log('Clicked on suggestion');
      } else {
        console.log('No matching suggestions found, trying to directly click an element that contains our location');
        // Try a more general approach
        await this.page.locator(`text="${location}"`).first().click();
      }
    } catch (error) {
      console.log('Error handling suggestions:', error);
      console.log('Trying fallback method: pressing Enter');
      
      // As a fallback, press Enter and then try to click the search button if it exists
      await this.page.keyboard.press('Enter');
      
      // Check if there's a search button and click it
      try {
        const searchButtonVisible = await this.page.locator(this.mapElements.searchButtonFallback)
          .isVisible({ timeout: 3000 });
        
        if (searchButtonVisible) {
          console.log('Clicking search button as fallback');
          await this.page.locator(this.mapElements.searchButtonFallback).click();
        }
      } catch (e) {
        console.log('Search button not found or not clickable');
      }
    }
    
    // Wait for map to load with new search results
    console.log('Waiting for map to load after search');
    await this.waitForMapLoad();
  }

  /**
   * Click on a specific coordinate on the map
   * @param {object} coordinates - Coordinates with lat and lng properties
   * @returns {Promise<void>}
   */
  async clickOnMapCoordinates(coordinates) {
    // Wait for map to be fully loaded
    await this.waitForMapLoad();
    
    // Get the map container
    const mapContainer = this.page.locator(this.mapElements.mapContainer);
    
    // Get the bounding box of the map container
    const boundingBox = await mapContainer.boundingBox();
    
    if (!boundingBox) {
      throw new Error('Could not get map bounding box');
    }
    
    // Click in the center of the map first (to focus it)
    await this.page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    
    // Use page.evaluate to execute script in browser context to pan the map
    await this.page.evaluate(({ lat, lng }) => {
      if (window.mapObject && typeof window.mapObject.panTo === 'function') {
        window.mapObject.panTo({ lat, lng });
      } else {
        console.log('Map object not found or panTo method not available');
      }
    }, coordinates);
    
    // Wait for the map to settle after panning
    await this.page.waitForTimeout(1000);
    
    // Now click on the map at the center again
    await this.page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    
    // Wait for any info window to appear
    try {
      await this.page.waitForSelector(this.mapElements.infoWindow, { 
        state: 'visible',
        timeout: 5000
      });
    } catch (e) {
      console.log('Info window did not appear after clicking on map');
    }
  }

  /**
   * Get all visible listing markers on the map
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async getVisibleMarkers() {
    await this.waitForMapLoad();
    return this.page.locator(this.mapElements.markers);
  }

  /**
   * Click on a marker and get listing details
   * @param {number} index - Index of the marker to click (0-based)
   * @returns {Promise<object>} - Listing details
   */
  async clickOnMarker(index = 0) {
    const markers = await this.getVisibleMarkers();
    const count = await markers.count();
    
    if (count === 0) {
      throw new Error('No markers found on the map');
    }
    
    if (index >= count) {
      throw new Error(`Marker index ${index} is out of range (0-${count-1})`);
    }
    
    // Click on the marker
    await markers.nth(index).click();
    
    // Wait for info window to appear
    await this.waitForElement(this.mapElements.infoWindow);
    
    // Extract information from the info window
    const infoWindow = this.page.locator(this.mapElements.infoWindow);
    
    // Get the address, price, and other details
    const address = await infoWindow.locator('h1, h2, h3').textContent();
    const price = await infoWindow.locator('*:has-text("€")').first().textContent();
    
    return {
      address: address?.trim() || '',
      price: price?.trim() || '',
      infoWindow
    };
  }

  /**
   * Apply filters on the map view
   * @param {object} filterData - Filter criteria
   * @returns {Promise<void>}
   */
  async applyMapFilters(filterData) {
    // Click on filter button to open filters
    await this.page.locator(this.filters.filterButton).click();
    
    // Apply price filters if provided
    if (filterData.price) {
      if (filterData.price.min) {
        await this.page.selectOption(this.filters.priceMin, 
          filterData.price.min.toString());
      }
      if (filterData.price.max) {
        await this.page.selectOption(this.filters.priceMax, 
          filterData.price.max.toString());
      }
    }
    
    // Apply living area filters if provided
    if (filterData.livingArea) {
      if (filterData.livingArea.min) {
        await this.page.selectOption(this.filters.livingAreaMin, 
          filterData.livingArea.min.toString());
      }
      if (filterData.livingArea.max) {
        await this.page.selectOption(this.filters.livingAreaMax, 
          filterData.livingArea.max.toString());
      }
    }
    
    // Apply filters
    await this.page.locator(this.filters.applyButton).click();
    
    // Wait for map to reload with new filters
    await this.waitForMapLoad();
  }
  
  /**
   * Get the current map URL
   * @returns {Promise<string>}
   */
  async getCurrentUrl() {
    return await this.page.url();
  }
}

module.exports = MapPage;