/**
 * Navigates the given page to BigBasket's homepage.
 * @param {import('puppeteer').Page} page
 */
async function navigateToHome(page) {
    await page.goto('https://www.blinkit.com', {
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

    const inputSelector = "input[placeholder='search delivery location']";
    await page.waitForSelector(inputSelector, { visible: true });
    await page.click(inputSelector);
    await page.keyboard.type(pincode, { delay: 500 });

    const suggestionSelector = "div[class*='LocationSearchList__LocationListContainer']";
    await page.waitForSelector(suggestionSelector, { visible: true });
    await page.click(suggestionSelector);
}

module.exports = { navigateToHome, setPincode };
