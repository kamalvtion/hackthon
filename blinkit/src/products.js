
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

// Product Name
    const nameEl = el.querySelector('.Product__UpdatedTitle-sc-11dk8zk-9');
    const productName = nameEl ? nameEl.innerText.trim() : '';

    // Prices
    const priceContainer = el.querySelector('.Product__UpdatedPriceAndAtcContainer-sc-11dk8zk-10');
    const currentPriceEl = priceContainer ? priceContainer.querySelector('div > div[style*="font-weight: 600"]') : null;
    const currentPrice = currentPriceEl ? currentPriceEl.innerText.trim() : '';

    const originalPriceEl = priceContainer ? priceContainer.querySelector('div > div[style*="line-through"]') : null;
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
      
      // const [brand, ...nameParts] = product.name.split('\n');
      const name = product.name.split('\n')[0];; 
      const brand= product.name.split(' ').slice(0, 2).join(' ');
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
            let logs = [];
    
            // Product Name
            const nameEl = el.querySelector("div[class*='Product__UpdatedTitle']");
            const productName = nameEl ? nameEl.innerText.trim() : '';
            logs.push(`Product Name: ${productName}`);
    
            // Prices
            const priceContainer = el.querySelector("div[class*='Product__UpdatedPriceAndAtcContainer']");
            let currentPrice = '';
            let originalPrice = '';
    
            if (priceContainer) {
                // Select the first child div which contains the two price divs
                const pricesParent = priceContainer.querySelector(':scope > div');
                if (pricesParent) {
                    const priceDivs = pricesParent.querySelectorAll('div');
                    if (priceDivs.length >= 2) {
                        currentPrice = priceDivs[0].innerText.trim();
                        originalPrice = priceDivs[1].innerText.trim();
                        logs.push(`Current Price: ${currentPrice}, Original Price: ${originalPrice}`);
                    } else {
                        currentPrice = priceDivs[0].innerText.trim();
                        logs.push('Price divs less than expected.');
                    }
                } else {
                    logs.push('Prices parent div not found.');
                }
            } else {
                logs.push(`Price container not found for product: ${productName}`);
            }
    
            // Stock Status
            const stockStatusElement = el.querySelector("div[class*='AddToCart__UpdatedOutOfStockTag']");
            let stockStatus = 'In Stock'; // Default to 'In Stock'
    
            if (stockStatusElement) {
                const statusText = stockStatusElement.querySelector('span')?.innerText || '';
                if (statusText.includes('Out of Stock')) {
                    stockStatus = 'Out Of Stock';
                    logs.push(`Stock Status via AddToCart__UpdatedOutOfStockTag: ${stockStatus}`);
                }
            }
    
            // Alternatively, check "Notify Me" button
            const notifyMeButton = el.querySelector("button[class*='CtaOnDeck___StyledNotifyMeButton']");
            if (notifyMeButton && notifyMeButton.innerText.includes('Notify Me')) {
                stockStatus = 'Out Of Stock';
                
            }
    
            // Sponsored
            const sponsoredEl = el.querySelector("div[class*='ProductTagstyles__Container']");
            let isSponsored = false;
            if (sponsoredEl) {
                const sponsoredText = sponsoredEl.textContent || sponsoredEl.innerText || '';
                if (sponsoredText.includes('Ad')) {
                    isSponsored = true;
                    logs.push(`Sponsored: ${isSponsored}`);
                }
            } else {
                logs.push('Sponsorship info not found.');
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