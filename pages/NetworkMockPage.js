const BasePage = require('./BasePage');

/**
 * Simplified page object for network mocking tests
 */
class NetworkMockPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {
    super(page, { domain: 'https://www.funda.nl' });

    // Track intercepted requests
    this.interceptedRequests = [];
    this.interceptedUrls = [];
    
    // Track if we've set up the request monitoring
    this.isMonitoringRequests = false;
    
    this.selectors = {
        searchBox: 'input[data-testid="search-box"]',
        searchBoxInput: 'input',
        searchSuggestions: '//ul[contains(@class,"suggestion-list")]',
        searchResults: '[data-test-id="search-box-list-item"]',
      
    };
  }

  
  /**
   * Perform a basic search
   * @param {string} searchTerm - Term to search for
   */
  async performSearch(searchTerm) {
    console.log(`Searching for: ${searchTerm}`);
    
   // Try to find and click the search box
   let searchBoxVisible = false;
    
   // Try the primary selector first
   try {
     searchBoxVisible = await this.page.locator(this.selectors.searchBox).isVisible({ timeout: 5000 });
   } catch (e) {
     console.log('Primary search box not found, trying fallback');
   }
   
    await this.page.locator(this.selectors.searchBox).click();
   
   // Wait for the input field to appear and be clickable
   console.log('Waiting for search input field to be visible');
   await this.page.waitForSelector(this.selectors.searchBoxInput, { state: 'visible', timeout: 10000 });
   
   // Clear the input field and type the searchTerm
   await this.page.locator(this.selectors.searchBoxInput).first().fill('');
   console.log('Typing search term:', searchTerm);
   await this.page.locator(this.selectors.searchBoxInput).first().fill(searchTerm);
   
   // Wait for suggestions to appear
   console.log('Waiting for search suggestions to appear');
   try {
     // First try to use the XPath selector for the suggestions
     await this.page.waitForSelector(this.selectors.searchSuggestions, { timeout: 10000 });
     
     
     // Click on the first suggestion that contains our searchTerm
     console.log('Clicking suggestion that matches:', searchTerm);
     
     // Using an XPath selector to find the suggestion containing our searchTerm text
     const suggestionXPath = `${this.selectors.searchSuggestions}//li[contains(., "${searchTerm}")]`;
     
     // Check if any matching suggestions exist
     const hasSuggestions = await this.page.locator(suggestionXPath).count() > 0;
     
     if (hasSuggestions) {
       // Click on the first matching suggestion
       await this.page.locator(suggestionXPath).first().click();
       console.log('Clicked on suggestion');
     } else {
       console.log('No matching suggestions found, trying to directly click an element that contains our searchTerm');
       // Try a more general approach
       await this.page.locator(`text="${searchTerm}"`).first().click();
     }
   } catch (error) {
     console.log('Error handling suggestions:', error);

     console.log('Trying fallback method: pressing Enter');
     
     // As a fallback, press Enter and then try to click the search button if it exists
     await this.page.keyboard.press('Enter');
   }
   
   // Take a screenshot after the search (for debugging)
   await this.page.screenshot({ path: 'after-search-completed.png' });
   
   // Wait for map to load with new search results
   console.log('Waiting for map to load after search');
   await this.waitForMapLoad();
 }

   /**
   * Start monitoring all network requests
   */
    async startRequestMonitoring() {
        if (this.isMonitoringRequests) {
          return;
        }
        
        console.log('Starting network request monitoring');
        
        // Monitor all requests
        await this.page.route('**', async route => {
          const request = route.request();
          const url = request.url();
          
          // Store intercepted URL
          this.interceptedUrls.push(url);
          console.log(`Detected request: ${url}`);
          
          // Continue the request normally
          await route.continue();
        });
        
        // Monitor all responses
        this.page.on('response', response => {
          const url = response.url();
          console.log(`Response received: ${url}`);
        });
        
        this.isMonitoringRequests = true;
      }
    
      /**
       * Setup network interception for any specified URL and mock data
       * @param {string} urlPattern - URL pattern to intercept
       * @param {Object} mockData - The mock data to return
       */
      async setupMockResponse(urlPattern, mockData) {
        console.log(`Setting up mock for pattern: ${urlPattern}`);
        
        // Start monitoring all requests to see what's happening
        await this.startRequestMonitoring();
        
        // Set up the mock response - use a more specific route handler
        await this.page.route(urlPattern, async route => {
          const url = route.request().url();
          console.log(`🔵 INTERCEPTED for mocking: ${url}`);
          
          // Add to our tracking arrays
          this.interceptedRequests.push(route.request());
          
          // Fulfill with mock data
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockData)
          });
        });
      }
    
      /**
       * Navigate to home page and accept cookies
       */
      async navigateToHome() {
        console.log('Navigating to home page');
        await this.navigate();
        await this.acceptCookiesIfVisible();
      }
    
      /**
       * Wait for page to load
       */
      async waitForMapLoad() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
      }
    
      /**
       * Get all intercepted request URLs
       * @returns {Array<string>} Array of URLs
       */
      getInterceptedUrls() {
        return this.interceptedUrls;
      }
    
      /**
       * Verify if any URL containing the pattern was intercepted
       * @param {string} pattern URL pattern to check for
       * @returns {boolean} True if any matching URL was intercepted
       */
      wasUrlPatternIntercepted(pattern) {
        console.log(`Checking if any URL containing '${pattern}' was intercepted`);
        console.log(`Total intercepted URLs: ${this.interceptedUrls.length}`);
        
        // Log all intercepted URLs for debugging
        this.interceptedUrls.forEach((url, index) => {
          console.log(`[${index}] ${url}`);
        });
        
        // Check if any URL matches our pattern
        const matchingUrls = this.interceptedUrls.filter(url => url.includes(pattern));
        
        console.log(`Found ${matchingUrls.length} matching URLs`);
        
        return matchingUrls.length > 0;
      }
    }
    
    module.exports = NetworkMockPage;