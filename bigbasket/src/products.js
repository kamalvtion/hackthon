
/**
 * Scrolls down the page until no new products are loaded or until maxNoChangeRetries is reached.
 * @param {import('puppeteer').Page} page
 * @param {string} productSelector - CSS selector for products
 * @param {number} scrollDelay - Delay in ms between scrolls
 * @param {number} maxNoChangeRetries - Maximum times to try without new products before stopping
 */
async function scrollUntilNoNewProducts(page, productSelector, scrollDelay = 1000, maxNoChangeRetries = 6) {
    let noChangeCount = 0;
    let previousCount = await page.$$eval(productSelector, els => els.length);
  
    while (noChangeCount < maxNoChangeRetries) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
  
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
  
      const currentCount = await page.$$eval(productSelector, els => els.length);
  
      if (currentCount > previousCount) {
        noChangeCount = 0;
        previousCount = currentCount;
      } else {
        noChangeCount++;
      }
    }
  
  }
  
  /**
   * Extracts product details from a single product element.
   * @param {Element} el - The product's root element.
   * @returns {{name: string, currentPrice: string, originalPrice: string, stockStatus: string, sponsored: boolean}}
   */
  function extractProductDetails(el) {
    // Name
    const nameEl = el.querySelector('h3');
    const productName = nameEl ? nameEl.innerText.trim() : '';
  
    // Prices
    const priceContainer = el.querySelector("div[class*='Pricing___StyledDiv']");
    const currentPriceEl = priceContainer ? priceContainer.querySelector("span[class*='Pricing___StyledLabel-']") : null;
    const currentPrice = currentPriceEl ? currentPriceEl.innerText.trim() : '';
    const originalPriceEl = priceContainer ? priceContainer.querySelector("span[class*='Pricing___StyledLabel2-']") : null;
    const originalPrice = originalPriceEl ? originalPriceEl.innerText.trim() : '';
  
    // Stock status
    const notifyMeButton = el.querySelector("button[class*='CtaOnDeck___StyledNotifyMeButton']");
    let stockStatus = 'In Stock';
    if (notifyMeButton && notifyMeButton.innerText.includes('Notify Me')) {
      stockStatus = 'Out Of Stock';
    }
  
    // Sponsored
    const sponsoredEl = el.querySelector("span[class*='CitrusAd___StyledTags']");
    let isSponsored = false;
    if (sponsoredEl) {
      const sponsoredText = sponsoredEl.textContent || sponsoredEl.innerText || '';
      if (sponsoredText.includes('Sponsored')) {
        isSponsored = true;
      }
    }
  
    return {
      name: productName,
      currentPrice,
      originalPrice,
      stockStatus,
      sponsored: isSponsored
    };
  }
  
  /**
   * Processes raw product data into a more structured format.
   * @param {Array<{name:string, currentPrice:string, originalPrice:string, stockStatus:string, sponsored:boolean}>} products
   * @returns {Array<{productName:string, brandName:string, price:string, discount:string, stock:string, sponsored:boolean}>}
   */
  function processProducts(products) {
    return products.map(product => {
      const [brand, ...nameParts] = product.name.split('\n');
      const name = nameParts[0] || ''; 
      const currentPrice = product.currentPrice.replace('₹', '');
      const originalPrice = product.originalPrice.replace('₹', '');
      
      let discount = '0%';
      if (originalPrice && !isNaN(originalPrice) && !isNaN(currentPrice) && parseFloat(originalPrice) > 0) {
        discount = Math.round(((parseFloat(originalPrice) - parseFloat(currentPrice)) / parseFloat(originalPrice)) * 100) + '%';
      }
  
      return {
        productName: name.trim(),
        brandName: brand.trim(),
        price: currentPrice,
        discount: discount,
        stock: product.stockStatus,
        sponsored: product.sponsored
      };
    });
  }
  
  /**
   * Fetches and returns all products currently visible on the page.
   * @param {import('puppeteer').Page} page 
   * @param {string} productSelector 
   * @returns {Promise<Array>}
   */
  async function getProductsOnPage(page, productSelector) {
    return page.$$eval(productSelector, els => {
      return els.map(el => {
        const nameEl = el.querySelector('h3');
        const productName = nameEl ? nameEl.innerText.trim() : '';
  
        const priceContainer = el.querySelector("div[class*='Pricing___StyledDiv']");
        const currentPriceEl = priceContainer ? priceContainer.querySelector("span[class*='Pricing___StyledLabel-']") : null;
        const currentPrice = currentPriceEl ? currentPriceEl.innerText.trim() : '';
  
        const originalPriceEl = priceContainer ? priceContainer.querySelector("span[class*='Pricing___StyledLabel2-']") : null;
        const originalPrice = originalPriceEl ? originalPriceEl.innerText.trim() : '';
  
        const notifyMeButton = el.querySelector("button[class*='CtaOnDeck___StyledNotifyMeButton']");
        let stockStatus = 'In Stock';
        if (notifyMeButton && notifyMeButton.innerText.includes('Notify Me')) {
          stockStatus = 'Out Of Stock';
        }
  
        const sponsoredEl = el.querySelector("span[class*='CitrusAd___StyledTags']");
        let isSponsored = false;
        if (sponsoredEl) {
          const sponsoredText = sponsoredEl.textContent || sponsoredEl.innerText || '';
          if (sponsoredText.includes('Sponsored')) {
            isSponsored = true;
          }
        }
  
        return {
          name: productName,
          currentPrice: currentPrice,
          originalPrice: originalPrice,
          stockStatus: stockStatus,
          sponsored: isSponsored
        };
      });
    });
  }

module.exports = {
    scrollUntilNoNewProducts,
    processProducts,
    getProductsOnPage
};