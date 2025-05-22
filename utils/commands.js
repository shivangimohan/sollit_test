/**
 * Custom commands for test automation
 */
 const { loadTestData, saveBrowserState, isStateFileValid } = require('./helpers');
 const path = require('path');
 
 // Import page objects
 const BasePage = require('../pages/BasePage');
 const LoginPage = require('../pages/LoginPage');
 const HomePage = require('../pages/HomePage');
 const SearchResultsPage = require('../pages/SearchResultsPage');
 const ListingDetailsPage = require('../pages/ListingDetailsPage');
 const MapPage = require('../pages/MapPage');
 
 /**
  * Initialize page objects
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {Object} options - Options for initialization
  * @param {boolean} [options.useMainSite] - Whether to use the main site domain
  * @returns {object} - Object containing initialized page objects
  */
 function initializePages(page, options = {}) {
   const useMainSite = options.useMainSite || false;
   
   // For pages that should always use the main site
   const domain = useMainSite ? 'https://www.funda.nl' : 'https://login.funda.nl';
   
   return {
     basePage: new BasePage(page, { domain }),
     loginPage: new LoginPage(page),
     homePage: new HomePage(page, { domain }),
     searchResultsPage: new SearchResultsPage(page, { domain }),
     listingDetailsPage: new ListingDetailsPage(page, { domain }),
     mapPage: new MapPage(page) // MapPage always uses the main site
   };
 }
 
 /**
  * Create a new account
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {object} userData - User registration data
  * @returns {Promise<boolean>} - True if registration successful
  */
 async function createAccount(page, userData) {
   const { loginPage } = initializePages(page);
   
   await loginPage.navigateToRegistration();
   const result = await loginPage.register(userData);
   
   return result;
 }
 
 /**
  * Login with credentials
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {object} credentials - Login credentials
  * @returns {Promise<boolean>} - True if login successful
  */
 async function login(page, credentials) {
   const { loginPage } = initializePages(page);
   
   await loginPage.navigateToLogin();
   const result = await loginPage.login(credentials.email, credentials.password);
   
   return result;
 }
 
 /**
  * Save login state for reuse in future tests
  * @param {import('@playwright/test').BrowserContext} context - Browser context
  * @param {string} stateFilePath - Path to save state
  * @returns {Promise<void>}
  */
 async function saveLoginState(context, stateFilePath) {
   await saveBrowserState(context, stateFilePath);
 }
 
 /**
  * Perform property search
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {string} keyword - Search keyword
  * @param {string} location - Location to search in
  * @returns {Promise<void>}
  */
 async function searchProperty(page, location) {
   // Initialize with main site domain
   const { homePage } = initializePages(page, { useMainSite: true });
   
   await homePage.navigateToHome();
   await homePage.search(location);
 }
 
 /**
  * Navigate to map search
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @returns {Promise<void>}
  */
 async function navigateToMapSearch(page) {
   const { mapPage } = initializePages(page);
   
   await mapPage.navigateToMapSearch();
 }
 
 /**
  * Click on specific map coordinates
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {object} coordinates - Coordinates (lat, lng)
  * @returns {Promise<void>}
  */
 async function clickOnMapCoordinates(page, coordinates) {
   const { mapPage } = initializePages(page);
   
   await mapPage.clickOnMapCoordinates(coordinates);
 }
 
 /**
  * Switch between list and card views and validate listing
  * @param {import('@playwright/test').Page} page - Playwright page object
  * @param {number} resultIndex - Index of the result to validate
  * @returns {Promise<object>} - Validation results
  */
 async function validateListingInBothViews(page, resultIndex = 0) {
   // Initialize with main site domain
   const { searchResultsPage } = initializePages(page, { useMainSite: true });
   
   // Get details in list view
   await searchResultsPage.switchToListView();
   const listViewDetails = await searchResultsPage.getResultDetails(resultIndex);
   
   // Switch to card view
   await searchResultsPage.switchToCardView();
   const cardViewDetails = await searchResultsPage.getResultDetails(resultIndex);
   
   // Compare details between views
   const titleMatch = listViewDetails.title === cardViewDetails.title;
   const priceMatch = listViewDetails.price === cardViewDetails.price;
   const locationMatch = listViewDetails.location === cardViewDetails.location;
   const idMatch = listViewDetails.listingId === cardViewDetails.listingId;
   
   return {
     titleMatch,
     priceMatch,
     locationMatch,
     idMatch,
     listViewDetails,
     cardViewDetails
   };
 }

 
 /**
  * Load test data from file
  * @param {string} dataType - Type of data to load
  * @returns {Promise<object>} - Loaded test data
  */
 async function getTestData(dataType) {
   const testDataPath = path.resolve(__dirname, '../data/test-data.json');
   const data = await loadTestData(testDataPath);
   
   if (!data[dataType]) {
     throw new Error(`Test data for type "${dataType}" not found in data file`);
   }
   
   return data[dataType];
 }
 
 /**
  * Load credentials from file
  * @param {string} userType - Type of user to load credentials for
  * @returns {Promise<object>} - User credentials
  */
 async function getCredentials(userType = 'testUser') {
   const credentialsPath = path.resolve(__dirname, '../data/credentials.json');
   const data = await loadTestData(credentialsPath);
   
   if (!data.users || !data.users[userType]) {
     throw new Error(`Credentials for user type "${userType}" not found in credentials file`);
   }
   
   return data.users[userType];
 }
 
 // Export all commands
 module.exports = {
   initializePages,
   createAccount,
   login,
   saveLoginState,
   searchProperty,
   navigateToMapSearch,
   clickOnMapCoordinates,
   validateListingInBothViews,
   getTestData,
   getCredentials
 };