const BasePage = require('./BasePage');

/**
 * Page object for the HomePage
 */
class HomePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {

    // Initialize with main site domain option
    super(page, { domain: 'https://www.funda.nl' });
    
    // Define selectors specific to home page
    this.searchBox = {
      input: 'input[data-test-id="input-search-query"]',
      locationInput: 'input[data-testid="search-box"]',
      locationSuggestions: 'li[data-testid="SearchBox-location-suggestion"]',
      filterButton: 'button[data-test-id="search-filters-button"]',
      mapViewButton: 'a[data-interaction-id="map-search"]',
    };
    
    this.filters = {
      priceMin: 'select[name="filter_KoopprijsVan"]',
      priceMax: 'select[name="filter_KoopprijsTot"]',
      livingAreaMin: 'select[name="filter_WoonOppervlakteVan"]',
      livingAreaMax: 'select[name="filter_WoonOppervlakteTot"]',
      keywordInput: 'input[name="filter_Trefwoorden"]',
      applyButton: 'button[data-interaction-id="search-filters-apply"]'
    };
  }

  /**
   * Navigate to the home page
   * @returns {Promise<void>}
   */
  async navigateToHome() {
    await this.navigate();
  }

  /**
   * Perform search by keyword and location
   * @param {string} location - Location to search in
   * @returns {Promise<void>}
   */
  async search(location) {
    // Make sure we're on home page
    if (!this.page.url().endsWith('.nl/') && !this.page.url().includes('funda.nl')) {
      await this.navigateToHome();
    }
    
    // Enter location
    await this.page.locator(this.searchBox.locationInput).click();
    await this.page.locator(this.searchBox.locationInput).fill(location);
    
    // Wait for and select the first suggestion
    await this.page.waitForSelector(this.searchBox.locationSuggestions);
    await this.page.locator(`${this.searchBox.locationSuggestions}:first-child`).click();
    
    // Wait for search results to load
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the map search view
   * @returns {Promise<void>}
   */
  async navigateToMapSearch() {
    // On the home page, click the map search button
    await this.page.locator(this.searchBox.mapViewButton).click();
    await this.waitForPageLoad();
  }

  /**
   * Apply filters to search
   * @param {object} filterData - Filter criteria
   * @returns {Promise<void>}
   */
  async applyFilters(filterData) {
    // Click on filter button to open filter menu
    await this.page.locator(this.searchBox.filterButton).click();
    
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
    
    // Apply keyword filter if provided
    if (filterData.keywords && filterData.keywords.length > 0) {
      await this.page.locator(this.filters.keywordInput)
        .fill(filterData.keywords.join(' '));
    }
    
    // Apply filters
    await this.page.locator(this.filters.applyButton).click();
    
    // Wait for results to load
    await this.waitForPageLoad();
  }
}

module.exports = HomePage;