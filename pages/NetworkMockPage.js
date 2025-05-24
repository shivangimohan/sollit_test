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