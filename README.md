# Sollit Test Automation

A comprehensive test automation suite for Funda.nl using Playwright, implementing the Page Object Model pattern with robust CAPTCHA handling and comprehensive test coverage.

## 🎯 Project Overview

This project provides automated testing for Funda.nl's core functionality including:
- User account management (registration/login)
- Property search (map and list views)
- Advanced filtering capabilities
- View switching (list/card views)
- PDF brochure download validation
- Network request mocking

## 🚀 Key Features

- **Page Object Model**: Clean, maintainable test architecture
- **CAPTCHA Handling**: Intelligent detection and manual solving workflow
- **Session Persistence**: Login state management across test runs
- **Dynamic Test Data**: JSON-driven test configuration
- **Cross-View Validation**: Ensures consistency between list and card views
- **PDF Download Testing**: Validates brochure downloads with new tab handling
- **Network Mocking**: API response simulation for reliable testing
- **Comprehensive Logging**: Detailed execution logs for debugging

## 📁 Project Structure

```
sollit-test/
├── data/
│   ├── credentials.json      # Test user credentials
│   ├── test-data.json       # Test data configuration
│   └── state.json           # Browser session state
├── pages/
│   ├── BasePage.js          # Base page object with common functionality
│   ├── LoginPage.js         # Login and registration operations
│   ├── HomePage.js          # Home page interactions
│   ├── MapPage.js           # Map search functionality
│   ├── SearchResultsPage.js # Search results handling
│   ├── ListingDetailsPage.js # Property details and filters
│   └── NetworkMockPage.js   # Network mocking utilities
├── tests/
│   ├── test1-account.spec.js      # Account management tests
│   ├── test2-map-search.spec.js   # Map search functionality
│   ├── test3-list-card-view.spec.js # View switching tests
│   ├── test4-download-brochure.spec.js # PDF brochure download tests
│   ├── test5-filters.spec.js      # Filter testing
│   └── test6-network-mock.spec.js # Network mocking tests
├── utils/
│   ├── commands.js          # Reusable test commands
│   ├── helpers.js           # Utility functions
│   └── ensureLoggedIn.js    # Login state management
├── playwright.config.js     # Playwright configuration
└── package.json            # Dependencies and scripts
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sollit-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

4. **Configure test credentials** (optional)
   
   Update `data/credentials.json` with valid test user credentials:
   ```json
   {
     "users": {
       "testUser": {
         "email": "your-test-email@example.com",
         "password": "YourPassword123"
       }
     }
   }
   ```

## 🏃‍♂️ Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests in headed mode (recommended for CAPTCHA handling)
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

### CAPTCHA Handling Mode

For tests requiring CAPTCHA solving:

```bash
npm run test:captcha
```

This runs tests in non-headless mode with slow motion for manual CAPTCHA solving.

### Individual Test Execution

```bash
# Run specific test file
npx playwright test tests/test1-account.spec.js

# Run with specific browser
npx playwright test --project=chromium

# Run with grep pattern
npx playwright test --grep "login"
```

## 📊 Test Reports

View test results:

```bash
npm run report
```

This opens an HTML report with detailed test execution results, screenshots, and traces.

## ⚙️ Configuration

### Playwright Configuration (`playwright.config.js`)

Key settings:
- **Timeout**: 2 minutes per test (for CAPTCHA handling)
- **Workers**: 1 (sequential execution to avoid conflicts)
- **Headless**: False by default (enables CAPTCHA solving)
- **Storage State**: Persistent login sessions
- **Screenshots**: On failure
- **Video**: On retry

### Test Data Configuration (`data/test-data.json`)

Customize test data:
- Search locations and coordinates
- Filter criteria (price, area, keywords)
- Mock API responses
- User registration data

## 🧪 Test Scenarios

### Test 1: Account Management
- ✅ User registration with email validation
- ✅ Secure login with session persistence
- ✅ CAPTCHA handling during authentication

### Test 2: Map Search
- ✅ Location-based search functionality
- ✅ Postcode search validation
- ✅ Coordinate-based navigation
- ✅ Dynamic test data usage

### Test 3: List/Card View Navigation
- ✅ View switching functionality
- ✅ Data consistency validation
- ✅ Cross-view property matching

### Test 4: Download Brochure
- ✅ PDF brochure link detection and clicking
- ✅ New tab handling for PDF opening
- ✅ PDF file validation (URL and content)
- ✅ Tab cleanup and management

### Test 5: Advanced Filtering
- ✅ Price range filtering
- ✅ Living area specifications
- ✅ Keyword-based filtering (garden, balcony, garage)
- ✅ URL parameter validation

### Test 6: Network Mocking
- ✅ API request interception
- ✅ Mock response injection
- ✅ Network monitoring and validation

## 🔧 Troubleshooting

### Common Issues

**CAPTCHA Appearing During Tests**
- Ensure tests run in headed mode: `npm run test:captcha`
- Manually solve CAPTCHA within 2-minute timeout
- Check console logs for guidance

**Login State Not Persisting**
- Verify `data/state.json` exists and contains valid cookies
- Delete state file to force fresh login
- Check credentials in `data/credentials.json`

**Test Timeouts**
- Increase timeout in `playwright.config.js`
- Check network connectivity
- Verify selectors haven't changed on the website

**Element Not Found Errors**
- Website UI may have changed
- Update selectors in respective page objects
- Check for dynamic loading issues

### Debug Mode

Run tests in debug mode for step-by-step execution:

```bash
npm run test:debug
```

This opens Playwright Inspector for interactive debugging.

### Logging

Enable detailed logging by setting environment variables:

```bash
DEBUG=pw:api npm test
```

## 🛡️ Security Considerations

- **Credentials**: Store sensitive data in environment variables for production
- **State Files**: Add `data/state.json` to `.gitignore` 
- **Test Data**: Use disposable test accounts for automated testing