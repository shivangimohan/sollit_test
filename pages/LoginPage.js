const BasePage = require('./BasePage');

/**
 * Page object for login and registration functionality
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {
    super(page);
    
    // Define selectors specific to login and registration based on the screenshots
    this.loginForm = {
      emailInput: 'input[id="UserName"]',
      passwordInput: 'input[id="Password"]',
      loginButton: 'button:has-text("Log in")',
      rememberMeCheckbox: 'input[type="checkbox"][id="RememberMe"]',
    };
    
    this.registrationForm = {
      firstNameInput: 'input[id="FirstName"]',
      lastNameInput: 'input[id="LastName"]',
      emailInput: 'input[id="Email"]',
      passwordInput: 'input[id="Password"]',
      submitButton: 'button:has-text("Aanmelden")',
      successMessage: 'div:has-text("Account bevestigen")'
    };
  }

  /**
   * Navigate to login page
   * @returns {Promise<void>}
   */
  async navigateToLogin() {
    await this.navigate('account/login');
    await this.acceptCookiesIfVisible();
    await this.handlePossibleCaptcha();
  }

  /**
   * Navigate to registration page
   * @returns {Promise<void>}
   */
  async navigateToRegistration() {
    await this.navigate('account/aanmelden');
    await this.acceptCookiesIfVisible();
    await this.handlePossibleCaptcha();
  }

/**
 * Login with the provided credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} - True if login successful
 */
 async login(email, password) {
  try {
    // First check if we're already logged in
    if (await this.isLoggedIn()) {
      console.log('User already logged in');
      return true;
    }
    
    // Navigate directly to the login page
    await this.navigateToLogin();
    
    // Handle access denied and CAPTCHA if they appear
    // Specify we want to return to the login page after CAPTCHA
    await this.handlePossibleCaptcha({ returnPath: 'account/login' });
    
    // At this point, we should be on the login form - verify this
    const loginButton = this.page.locator('button:has-text("Log in")');
    const isOnLoginForm = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isOnLoginForm) {
      console.log('Not on login form after CAPTCHA handling, trying to navigate again');
      await this.navigateToLogin();
      await this.handlePossibleCaptcha({ returnPath: 'account/login' });
    }
    
    console.log('Filling login form with email:', email);
    
    // Fill in login form fields
    await this.page.locator(this.loginForm.emailInput).fill(email);
    await this.page.locator(this.loginForm.passwordInput).fill(password);
    
    // Check "Remember me" checkbox if present and not already checked
    try {
      const rememberMeCheckbox = this.page.locator(this.loginForm.rememberMeCheckbox);
      const isChecked = await rememberMeCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        await rememberMeCheckbox.check();
        console.log('Checked "Remember me" checkbox');
      }
    } catch (error) {
      console.log('Could not check "Remember me" checkbox:', error.message);
    }
    
    // Submit the form
    console.log('Clicking login button');
    await this.page.locator(this.loginForm.loginButton).click();
    
    // After clicking login, we might get CAPTCHA again, so handle it
    await this.handlePossibleCaptcha({ returnPath: 'account/login' });
    
    // Wait for redirection or success indicator
    try {
      await Promise.race([
        this.page.waitForNavigation({ timeout: 10000 }),
        this.page.waitForSelector('a:has-text("Uitloggen"), a:has-text("Logout")', { timeout: 10000 })
      ]);
      console.log('Navigation or logout link detected after login');
    } catch (error) {
      console.log('No explicit navigation event after login, checking logged in state');
    }
    
    // Verify login was successful
    const isLoggedIn = await this.isLoggedIn();
    console.log('Is user logged in after login attempt?', isLoggedIn);
    return isLoggedIn;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

 /**
 * Register a new user account
 * @param {object} userData - User registration data
 * @returns {Promise<boolean>} - True if registration successful
 */
async register(userData) {
  try {
    console.log('=== STARTING REGISTRATION PROCEDURE ===');
    
    // First, navigate to registration page
    await this.navigateToRegistration();
    
    // Handle CAPTCHA that might appear on registration page
    await this.handlePossibleCaptcha({ returnPath: 'account/aanmelden' });
    
    // Check if we're on the registration page
    const currentUrl = this.page.url();
    console.log('Current URL after navigation to registration:', currentUrl);
    
    // Verify we're on the aanmelden page
    if (!currentUrl.includes('aanmelden')) {
      console.log('Not on registration page, trying to navigate again');
      await this.navigateToRegistration();
      await this.handlePossibleCaptcha({ returnPath: 'account/aanmelden' });
    }
    
    // Fill in registration form
    console.log('Filling registration form with data:', JSON.stringify({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    }, null, 2));
    
    try {
      await this.page.locator(this.registrationForm.firstNameInput).fill(userData.firstName);
      console.log('First name filled');
    } catch (e) {
      console.error('Error filling first name:', e);
    }
    
    try {
      await this.page.locator(this.registrationForm.lastNameInput).fill(userData.lastName);
      console.log('Last name filled');
    } catch (e) {
      console.error('Error filling last name:', e);
    }
    
    try {
      await this.page.locator(this.registrationForm.emailInput).fill(userData.email);
      console.log('Email filled');
    } catch (e) {
      console.error('Error filling email:', e);
    }
    
    try {
      await this.page.locator(this.registrationForm.passwordInput).fill(userData.password);
      console.log('Password filled');
    } catch (e) {
      console.error('Error filling password:', e);
    }
    
    // Submit the form
    console.log('Submitting registration form');
    
    const submitButton = this.page.locator(this.registrationForm.submitButton);
    const isSubmitVisible = await submitButton.isVisible().catch(() => false);
    
    if (!isSubmitVisible) {
      console.error('Submit button not found!');
      await this.page.screenshot({ path: 'submit-button-not-found.png' });
      return false;
    }
    
    await submitButton.click();
    
    // Handle possible CAPTCHA after submission
    await this.handlePossibleCaptcha({ returnPath: 'account/aanmelden' });
    
    // Wait for success message or redirection
    console.log('Waiting for registration success indicators...');
    
    try {
      // Wait for registration success indicators
      await Promise.race([
        // Success message
        this.page.waitForSelector(this.registrationForm.successMessage, { timeout: 10000 })
          .then(() => console.log('Registration success message found'))
          .catch(() => {}),
      ]);
      return true;
    } catch (error) {
      console.log('No explicit success message or navigation detected');
      return false;
    }
    
    
    // Check if we're logged in now
   
  } catch (error) {
    console.error('Registration failed:', error);
    return false;
  }
}
}

module.exports = LoginPage;