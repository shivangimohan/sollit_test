/**
 * Helper utility to ensure a user is logged in before running tests that require authentication
 */
 const { login, getCredentials } = require('./commands');
 const fs = require('fs').promises;
 const path = require('path');
 
 /**
  * Ensure a user is logged in before running tests
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @returns {Promise<boolean>} - True if user is already logged in or was successfully logged in
  */
 async function ensureLoggedIn(page) {
   console.log('Ensuring user is logged in before proceeding...');
   
   // Initialize base page to check login status
   const BasePage = require('../pages/BasePage');
   const basePage = new BasePage(page);
   
   // First check if the user is already logged in
   const isAlreadyLoggedIn = await basePage.isLoggedIn();
   
   if (isAlreadyLoggedIn) {
     console.log('User is already logged in, proceeding with test.');
     return true;
   }
   
   console.log('User is not logged in, attempting to log in...');
   
   // Check if we have a valid storage state file
   const storageStatePath = path.join(__dirname, '../data/state.json');
   
   try {
     // Check if state.json exists and is valid
     await fs.access(storageStatePath);
     const stateContent = await fs.readFile(storageStatePath, 'utf8');
     const state = JSON.parse(stateContent);
     
     // Check if state has cookies (simplified check)
     if (state && state.cookies && state.cookies.length > 0) {
       console.log('Found valid state.json file, using stored credentials');
       
       // Apply the state to the current context
       await page.context().addCookies(state.cookies);
       
       // Navigate to a page to check if we're logged in with these cookies
       await page.goto('https://www.funda.nl');
       
       // Check login state again
       const loginStateAfterCookies = await basePage.isLoggedIn();
       
       if (loginStateAfterCookies) {
         console.log('Successfully logged in using stored cookies');
         return true;
       }
       
       console.log('Stored cookies did not result in a logged-in state, trying manual login');
     }
   } catch (error) {
     console.log('No valid state.json file found or error loading it:', error.message);
   }
   
   // If we reach here, we need to perform a manual login
   try {
     // Get credentials
     const credentials = await getCredentials();
     
     // Perform login
     const loginResult = await login(page, credentials);
     
     if (loginResult) {
       console.log('Successfully logged in manually');
       return true;
     } else {
       console.error('Failed to log in manually');
       return false;
     }
   } catch (error) {
     console.error('Error during manual login:', error);
     return false;
   }
 }
 
 module.exports = ensureLoggedIn;