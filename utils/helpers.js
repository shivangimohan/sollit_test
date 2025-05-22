/**
 * Utility helper functions for test automation
 */
 const fs = require('fs').promises;
 const path = require('path');
 const crypto = require('crypto');
 
 /**
  * Generate a random email address for registration
  * @returns {string} Random email address
  */
 function generateRandomEmail() {
   const timestamp = Date.now();
   const randomString = crypto.randomBytes(8).toString('hex');
   return `test_${timestamp}_${randomString}@example.com`;
 }
 
 /**
  * Generate a random password
  * @param {number} length - Length of the password
  * @returns {string} Random password
  */
 function generateRandomPassword(length = 0) {
   const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
   let password = '';
   
   // Ensure we have at least one uppercase, one lowercase, one number, and one symbol
   password += 'A'; // Uppercase
   password += 'a'; // Lowercase
   password += '1'; // Number
   password += '!'; // Symbol
   
   // Fill the rest with random characters
   for (let i = password.length; i < length; i++) {
     const randomIndex = Math.floor(Math.random() * chars.length);
     password += chars[randomIndex];
   }
   
   // Shuffle the password
   return password.split('').sort(() => 0.5 - Math.random()).join('');
 }
 
 /**
  * Load test data from JSON file
  * @param {string} filePath - Path to JSON file
  * @returns {Promise<object>} Parsed JSON data
  */
 async function loadTestData(filePath) {
   try {
     const data = await fs.readFile(filePath, 'utf8');
     return JSON.parse(data);
   } catch (error) {
     console.error(`Failed to load test data from ${filePath}:`, error);
     return {};
   }
 }
 
 /**
  * Save browser state to a file for login persistence
  * @param {import('@playwright/test').BrowserContext} context - Browser context
  * @param {string} filePath - Path to save state
  * @returns {Promise<void>}
  */
 async function saveBrowserState(context, filePath) {
   try {
     // Get storage state (cookies, localStorage, etc.)
     const state = await context.storageState();
     
     // Ensure directory exists
     const dir = path.dirname(filePath);
     await fs.mkdir(dir, { recursive: true });
     
     // Save state to file
     await fs.writeFile(filePath, JSON.stringify(state, null, 2));
     console.log(`Browser state saved to ${filePath}`);
   } catch (error) {
     console.error('Failed to save browser state:', error);
   }
 }
 
 /**
  * Check if state file exists and is valid
  * @param {string} filePath - Path to state file
  * @returns {Promise<boolean>}
  */
 async function isStateFileValid(filePath) {
   try {
     // Check if file exists
     await fs.access(filePath);
     
     // Check if file is valid JSON
     const data = await fs.readFile(filePath, 'utf8');
     const state = JSON.parse(data);
     
     // Check if state has cookies
     return state && state.cookies && state.cookies.length > 0;
   } catch (error) {
     // File doesn't exist or isn't valid
     return false;
   }
 }
 
 module.exports = {
   generateRandomEmail,
   generateRandomPassword,
   loadTestData,
   saveBrowserState,
   isStateFileValid
 };