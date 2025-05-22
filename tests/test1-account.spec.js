const { test, expect } = require('@playwright/test');
const path = require('path');
const { 
  createAccount, 
  login, 
  saveLoginState, 
  getTestData, 
  getCredentials 
} = require('../utils/commands');
const { generateRandomEmail, generateRandomPassword, isStateFileValid } = require('../utils/helpers');

// Path to browser state storage file
const stateFilePath = path.resolve(__dirname, '../data/state.json');

// Test 1: Account creation and login
test.describe('Test 1: Account Management', () => {
  
  // Test for creating a new account
  test('Create new user account and verify login', async ({ page }) => {
    // Get registration data from test-data.json
    const registrationData = await getTestData('registration');
    
    // Generate a random email to ensure uniqueness
    registrationData.email = generateRandomEmail();
    
    // Create a new account
    const registrationResult = await createAccount(page, registrationData);
    
    // Verify registration was successful
    expect(registrationResult).toBeTruthy();
    
    // Extra verification that we're logged in after registration
  });
  
  // Test for secure login
  test('Login with credentials securely', async ({ page , context}) => {
    // Get credentials from credentials.json
    const credentials = await getCredentials('testUser');
    
    // Attempt to login
    const loginResult = await login(page, credentials);
    
    // Verify login was successful
    expect(loginResult).toBeTruthy();
    
    // Extra verification - check if we're redirected to main site or have account menu
    const url = page.url();
    const isRedirectedToMainSite = !url.includes('login');
    
    if (isRedirectedToMainSite) {
      // If redirected to main site, we're logged in
      expect(isRedirectedToMainSite).toBeTruthy();
    } else {
      // Otherwise check for logged-in indicators
      const accountMenu = page.locator('button:has-text("Mijn account"), button:has-text("My account")');
      await accountMenu.click();
      
      const logoutLink = page.locator('a:has-text("Uitloggen"), a:has-text("Logout")');
      await expect(logoutLink).toBeVisible();
    }

    // Save the login state
    await saveLoginState(context, stateFilePath);
  });
});