/**
 * Base page class that provides common functionality for all page objects
 */
 class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   * @param {Object} options - Options for the base page
   * @param {string} [options.domain] - Override the default domain (login.funda.nl)
   */
  constructor(page, options = {}) {
    this.page = page;
    
    // Store both domains to use as needed
    this.domains = {
      auth: 'https://login.funda.nl',
      main: 'https://www.funda.nl'
    };
    
    // Default to the auth domain unless otherwise specified
    this.baseUrl = options.domain || this.domains.auth;
    
    // Common selectors that might be used across pages
    this.cookieBanner = {
      acceptButton: '[aria-label="Alles accepteren"]',
      rejectButton: '[aria-label="Alles weigeren"]',
    };
  }

  /**
   * Navigate to the specified path
   * @param {string} path - Path to navigate to
   * @param {Object} options - Navigation options
   * @param {boolean} [options.useMainSite] - Whether to use the main site domain
   * @returns {Promise<void>}
   */
  async navigate(path = '', options = {}) {
    // Determine which domain to use
    const domain = options.useMainSite ? this.domains.main : this.baseUrl;
    
    // Special handling for paths that should always use the main site
    const alwaysUseMainSitePaths = ['zoeken', 'koop', 'huur', 'mijn'];
    const shouldUseMainSite = alwaysUseMainSitePaths.some(prefix => path.startsWith(prefix));
    
    const targetDomain = shouldUseMainSite ? this.domains.main : domain;
    
    console.log(`Navigating to: ${targetDomain}/${path}`);
    await this.page.goto(`${targetDomain}/${path}`);
  }

  /**
   * Check if currently on the main Funda site
   * @returns {Promise<boolean>}
   */
  async isOnMainSite() {
    const url = this.page.url();
    return url.includes('www.funda.nl');
  }

  /**
   * Wait for the page to be loaded
   * @returns {Promise<void>}
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Accept cookies if the banner is visible
   * @returns {Promise<void>}
   */
  async acceptCookiesIfVisible() {
    try {
      // Wait for cookie banner with short timeout
      const cookieAcceptButton = this.page.locator(this.cookieBanner.acceptButton);
      await cookieAcceptButton.waitFor({ timeout: 5000 });
      
      if (await cookieAcceptButton.isVisible()) {
        await cookieAcceptButton.click();
        // Wait a bit for the banner to disappear
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      // Cookie banner might not be present, continue
      console.log('Cookie banner not detected or already accepted');
    }
  }

  /**
   * Check if user is logged in with more comprehensive checks
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    try {
      console.log('Checking if user is logged in...');
      console.log('Current URL:', this.page.url());
      
      // Add a short wait to ensure the page has fully loaded
      await this.page.waitForTimeout(1000);
      
      // 1. Check URL patterns that indicate successful login
      const url = this.page.url();
      
      // Check main site redirection - after login users are often redirected to the main site
      if (url.includes('www.funda.nl') || (!url.includes('login.funda.nl') && url.includes('funda.nl'))) {
        console.log('User is logged in - redirected to main Funda site');
        return true;
      }
      
      // 2. Check for personal account elements that appear only when logged in
      const loggedInIndicators = [
        // User information elements
        'text=Account',
      ];
      
      // Try each indicator
      for (const indicator of loggedInIndicators) {
        try {
          const element = this.page.locator(indicator);
          const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`User is logged in - found indicator: ${indicator}`);
            return true;
          }
        } catch (error) {
          // Continue checking other indicators
        }
      }
      
      // 3. Try clicking on account menu if it exists - sometimes login indicators are hidden in menu
      try {
        const accountMenu = this.page.locator('button:has-text("Account")');
        const isMenuVisible = await accountMenu.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (isMenuVisible) {
          await accountMenu.click();
          await this.page.waitForTimeout(500);
          
          // Check for logout option which confirms logged-in state
          const logoutLink = this.page.locator('a:has-text(" Uitloggen")');
          const isLogoutVisible = await logoutLink.isVisible({ timeout: 1000 }).catch(() => false);
          
          if (isLogoutVisible) {
            console.log('User is logged in - found logout link in account menu');
            return true;
          }
        }
      } catch (error) {
        console.log('Error checking account menu:', error.message);
      }
      
      // 4. Check for CAPTCHA or login form - indicates NOT logged in
      const notLoggedInIndicators = [
        'input[id="UserName"]',
        'input[id="Password"]',
        'button:has-text("Log in")'
      ];
      
      for (const indicator of notLoggedInIndicators) {
        try {
          const element = this.page.locator(indicator);
          const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`User is NOT logged in - found login/captcha element: ${indicator}`);
            return false;
          }
        } catch (error) {
          // Continue checking other indicators
        }
      }
      
      console.log('No definitive login indicators found, assuming not logged in');
      return false;
    } catch (error) {
      console.error('Error checking login state:', error);
      return false;
    }
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - Element selector
   * @param {object} options - Wait options
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async waitForElement(selector, options = {}) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', ...options });
    return element;
  }

  /**
   * Handle the complex CAPTCHA flow on Funda.nl
   * @param {Object} options - Options for CAPTCHA handling
   * @param {string} options.returnPath - Path to return to after CAPTCHA (e.g., 'account/login' or 'account/aanmelden')
   * @param {boolean} options.useMainSite - Whether to use the main site domain for the return path
   * @returns {Promise<void>}
   */
  async handlePossibleCaptcha(options = {}) {
    // Default to login page if no return path specified
    const returnPath = options.returnPath || 'account/login';
    const useMainSite = options.useMainSite || false;
    
    console.log('Checking for access denied or CAPTCHA...');
    
    // First, check for access denied page (HTTP ERROR 403)
    const accessDeniedLocator = this.page.locator('text=Access to login.funda.nl was denied');
    const accessDeniedVisible = await accessDeniedLocator.isVisible({ timeout: 3000 })
      .catch(() => false);
    
    if (accessDeniedVisible) {
      console.log('Access denied page detected. Refreshing the page...');
      await this.page.reload();
      // Wait a moment for the page to load
      await this.page.waitForTimeout(2000);
    }
    
    // Check for the CAPTCHA page "Je bent bijna op de pagina die je zoekt"
    const captchaPageTitleLocator = this.page.locator('text=Je bent bijna op de pagina die je zoekt');
    
    const isCaptchaPageVisible = await captchaPageTitleLocator.isVisible({ timeout: 3000 })
      .catch(() => false);
    
    if (isCaptchaPageVisible) {
      console.log('CAPTCHA page detected! Preparing to handle CAPTCHA...');
      
      // In headless mode, stop the test
      if (process.env.HEADLESS !== 'false' && process.env.HEADLESS !== '0') {
        throw new Error('CAPTCHA detected in headless mode. Test cannot proceed automatically.');
      }
      
      // Display a message to the user
      console.log('MANUAL ACTION NEEDED: Please solve the CAPTCHA');
      console.log('You have 2 minutes to complete all CAPTCHA steps:');
      console.log('1. Click the "I\'m not a robot" checkbox');
      console.log('2. Complete any image selection challenges');
      console.log('3. Wait until you\'re redirected to the login form');
      
      try {
        // Wait for the CAPTCHA to be solved and page to change
        // Using a longer timeout (2 minutes) for the complete CAPTCHA flow
        const timeout = 120000; // 2 minutes
        
        // Set up periodic checks
        const checkInterval = 3000; // 3 seconds
        let timeElapsed = 0;
        
        // Look for these elements that indicate we've moved past CAPTCHA
        const loginFormLocator = this.page.locator('button:has-text("Log in"), input[placeholder="E-mailadres"]');
        
        while (timeElapsed < timeout) {
          // Check if we're no longer on the CAPTCHA page or if login form is visible
          const stillOnCaptchaPage = await captchaPageTitleLocator.isVisible().catch(() => false);
          const loginFormVisible = await loginFormLocator.isVisible().catch(() => false);
          
          if (!stillOnCaptchaPage || loginFormVisible) {
            console.log('Successfully passed CAPTCHA challenge!');
            break;
          }
          
          // Wait for the interval before checking again
          await this.page.waitForTimeout(checkInterval);
          timeElapsed += checkInterval;
          
          console.log(`Still waiting for CAPTCHA completion... (${timeElapsed/1000}s elapsed)`);
        }
        
        if (timeElapsed >= timeout) {
          throw new Error('CAPTCHA solving timeout exceeded. Test failed.');
        }
        
        // Wait a moment for the page to stabilize after CAPTCHA
        await this.page.waitForTimeout(2000);
        
      } catch (error) {
        console.error('CAPTCHA handling failed:', error);
        throw new Error('Failed to handle CAPTCHA: ' + error.message);
      }
    }
    
    // Check for image selection challenge directly
    const imageSelectLocator = this.page.locator('.rc-imageselect-challenge, [class*="imageselect"]');
    const isImageSelectVisible = await imageSelectLocator.isVisible({ timeout: 2000 })
      .catch(() => false);
    
    if (isImageSelectVisible) {
      console.log('Image selection CAPTCHA detected! Please solve manually...');
      
      // Wait for image challenge to be completed (max 2 minutes)
      try {
        // Wait for the CAPTCHA to disappear or for navigation
        await Promise.race([
          this.page.waitForFunction(
            () => !document.querySelector('.rc-imageselect-challenge, [class*="imageselect"]'),
            { timeout: 120000 }
          ),
          this.page.waitForNavigation({ timeout: 120000 })
        ]);
        
        console.log('Image selection challenge completed successfully!');
        
        // Wait for page to stabilize
        await this.page.waitForTimeout(2000);
      } catch (error) {
        console.error('Image selection challenge timeout:', error);
        throw new Error('Image CAPTCHA solving timeout exceeded. Test failed.');
      }
    }
    
    // After handling CAPTCHA, check if we need to re-navigate to the specified return path
    const currentUrl = this.page.url();
    const targetDomain = useMainSite ? this.domains.main : this.domains.auth;
    
    // Check if we're on the main site after login but need to be on a specific page
    const onMainSite = currentUrl.includes('www.funda.nl');
    const authSitePath = returnPath.includes('account/');
    
    // If we're on the main site but need to be on auth site path, or vice versa
    if ((onMainSite && authSitePath && !useMainSite) || 
        (!onMainSite && !authSitePath && useMainSite) ||
        (!currentUrl.includes(returnPath))) {
      
      console.log(`Not on ${returnPath} after CAPTCHA handling, navigating to ${targetDomain}/${returnPath}`);
      await this.navigate(returnPath, { useMainSite });
      await this.page.waitForTimeout(1000);
    }
  }
}

module.exports = BasePage;