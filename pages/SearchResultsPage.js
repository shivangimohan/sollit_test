const BasePage = require('./BasePage');

/**
 * Page object for search results functionality
 */
class SearchResultsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {
    // Initialize with main site domain option
    super(page, { domain: 'https://www.funda.nl' });
    
    // Define selectors specific to search results
    this.searchResults = {
      resultItems: 'ul[data-test-id="search-results"] > li',
      resultItemTitle: '[data-test-id="street-name-house-number"]',
      resultItemPrice: '[data-test-id="price"]',
      resultItemLocation: '[data-test-id="property-address"]',
      resultCount: 'h1[data-testid="pageHeader"]',
      listViewButton: 'div:has-text(" Lijst")',
      cardViewButton: 'div:has-text(" Kaart")',
      noResultsMessage: 'div[data-test-id="no-results"]',
    };
    
    this.filters = {
      filterButton: 'button[data-test-id="search-filters-button"]',
      priceMin: 'select[name="filter_KoopprijsVan"]',
      priceMax: 'select[name="filter_KoopprijsTot"]',
      livingAreaMin: 'select[name="filter_WoonOppervlakteVan"]',
      livingAreaMax: 'select[name="filter_WoonOppervlakteTot"]',
      keywordInput: 'input[name="filter_Trefwoorden"]',
      applyButton: 'button[data-interaction-id="search-filters-apply"]'
    };
  }

  /**
   * Wait for search results to load
   * @returns {Promise<void>}
   */
  async waitForSearchResults() {
    try {
      // Wait for either search results or no results message
      await Promise.race([
        this.page.waitForSelector(this.searchResults.resultItems, { timeout: 10000 }),
        this.page.waitForSelector(this.searchResults.noResultsMessage, { timeout: 10000 })
      ]);
      
      // Wait a moment for any animations to complete
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.error('Failed to wait for search results:', error);
    }
  }

  /**
   * Get count of search results
   * @returns {Promise<number>}
   */
  async getResultCount() {
    try {
      // Check if no results message is present
      const noResultsVisible = await this.page.isVisible(this.searchResults.noResultsMessage);
      if (noResultsVisible) {
        return 0;
      }
      
      // Get the results count text
      const countElement = this.page.locator(this.searchResults.resultCount);
      const countText = await countElement.textContent();
      
      // Extract number from text (e.g., "123 resultaten" -> 123)
      const match = countText?.match(/(\d+(?:,\d+)*)/);
      if (match) {
        // Remove commas from number and parse as integer
        return parseInt(match[1].replace(/,/g, ''), 10);
      }
      
      // If count text not available, count result items
      const resultItems = this.page.locator(this.searchResults.resultItems);
      return await resultItems.count();
    } catch (error) {
      console.error('Failed to get result count:', error);
      return 0;
    }
  }

  /**
   * Switch to list view
   * @returns {Promise<void>}
   */
   async switchToListView() {
    const listViewButton = this.page.locator(this.searchResults.listViewButton);
    
    // First check if the button is visible
    const isVisible = await listViewButton.isVisible().catch(() => false);
    
    // If button is not visible, assume list view is already selected and return
    if (!isVisible) {
      return; // List view is already selected, no need to click
    }
    
    // Only click if button is visible and not selected
    if (isVisible) {
      await listViewButton.click();
      await this.waitForSearchResults();
    }
  }

  /**
   * Switch to card view
   * @returns {Promise<void>}
   */
  async switchToCardView() {
    const cardViewButton = this.page.locator(this.searchResults.cardViewButton);

     // First check if the button is visible
     const isVisible = await cardViewButton.isVisible().catch(() => false);

      // If button is not visible, assume card view is already selected and return
    if (!isVisible) {
      return; // Card view is already selected, no need to click
    }
    
    if (isVisible) {
      await cardViewButton.click();
      await this.waitForSearchResults();
    }
  }

  /**
   * Get details of a specific search result
   * @param {number} index - Index of the search result (0-based)
   * @returns {Promise<object>}
   */
  async getResultDetails(index = 0) {
    const resultItems = this.page.locator(this.searchResults.resultItems);
    const count = await resultItems.count();
    
    if (count === 0) {
      throw new Error('No search results found');
    }
    
    if (index >= count) {
      throw new Error(`Result index ${index} is out of range (0-${count-1})`);
    }
    
    const resultItem = resultItems.nth(index);
    
    // Extract details
    const title = await resultItem.locator(this.searchResults.resultItemTitle).textContent();
    const price = await resultItem.locator(this.searchResults.resultItemPrice).textContent();
    const location = await resultItem.locator(this.searchResults.resultItemLocation).textContent();
    
    // Get the listing ID from URL or data attribute
    let listingId = '';
    const href = await resultItem.locator('a').first().getAttribute('href');
    if (href) {
      // Extract ID from URL, e.g., "/koop/amsterdam/huis-12345678/"
      const match = href.match(/\/([^\/]+)\/$/);
      if (match && match[1].includes('-')) {
        listingId = match[1].split('-').pop();
      }
    }
    
    return {
      title: title?.trim() || '',
      price: price?.trim() || '',
      location: location?.trim() || '',
      listingId,
      element: resultItem
    };
  }
}

module.exports = SearchResultsPage;