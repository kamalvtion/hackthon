const fs = require('fs');
const { initBrowser } = require('./src/browser');
const { navigateToHome, setPincode } = require('./src/actions');
const { scrapeBanners } = require('./src/ocr');
const { scrollUntilNoNewProducts, processProducts, getProductsOnPage } = require('./src/products');
require('dotenv').config();
(async () => {
    let browser;
    try {
        const { browser: br, page } = await initBrowser();
        browser = br;
    
        await navigateToHome(page);
    
        const newPincode = process.env.NEW_PINCODE;
        const platform = process.env.PLATFORM;
        const category = process.env.CATEGORY;
        const demography = JSON.parse(process.env.DEMOGRAPHY); // Parse the JSON string
        const categoryUrl = process.env.CATEGORY_URL;
        await setPincode(page, newPincode);
    
        const ads = await scrapeBanners(page);
        // console.log(ads);
        
        await page.goto(categoryUrl,{ waitUntil: 'domcontentloaded', timeout: 60000 } );
    
        const productSelector = "div[class*='Product__UpdatedPlpProductContainer']";
        await scrollUntilNoNewProducts(page, productSelector, 1500, 6);
    
        const products = await getProductsOnPage(page, productSelector);
        const processedProducts = processProducts(products);
 
    //     // Separate sponsored and non-sponsored products
        const sponsoredProducts = processedProducts.filter(p => p.sponsored);
        const nonSponsoredProducts = processedProducts.filter(p => !p.sponsored).map(item => {
        // Remove the 'sponsored' property from non-sponsored products
            const { sponsored, ...rest } = item;
            return rest;
        });
  
      sponsoredProducts.forEach(product=>{ads.push(product)})
      let output = {
        "platform": platform,
        "category":category,
        "location":newPincode,
        "demographic":demography,
        "data":{
            "ads":ads,
            "products":nonSponsoredProducts
        }
      }
    //   // Define the file path where you want to save the JSON
        const filePath = './output.json';

    //     // Convert the `output` object to a JSON string and save it
        fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf8');

    //     console.log(`Data has been saved to ${filePath}`);
      
    } catch (error) {
      console.error('Error accessing BigBasket:', error);
    } finally {
      if (browser) {
        // Close the browser in production
        await browser.close();
      }
    }
  })();