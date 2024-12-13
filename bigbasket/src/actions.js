/**
 * Navigates the given page to BigBasket's homepage.
 * @param {import('puppeteer').Page} page
 */
async function navigateToHome(page) {
    await page.goto('https://www.bigbasket.com', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });
}

/**
 * Sets the pincode on BigBasket's website.
 * @param {import('puppeteer').Page} page
 * @param {string} pincode
 */
async function setPincode(page, pincode) {
    const pincodeButtonSelector = "button[class*='AddressDropdown___StyledMenuButton']";
    await page.waitForSelector(pincodeButtonSelector);
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, pincodeButtonSelector);

    const inputSelector = "input[placeholder='Search for area or street name']";
    await page.waitForSelector(inputSelector, { visible: true });
    await page.click(inputSelector);
    await page.keyboard.type(pincode, { delay: 100 });

    const suggestionSelector = "li[class*='AddressDropdown___StyledMenuItem']";
    await page.waitForSelector(suggestionSelector, { visible: true });
    await page.click(suggestionSelector);
}

module.exports = { navigateToHome, setPincode };
