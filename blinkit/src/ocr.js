const axios = require('axios');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Cleans the extracted text from OCR.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
    return text
        .replace(/[\r\n]+/g, ' ')     // Remove newlines
        .replace(/[^\w\s,.%]/g, '')   // Remove non-alphanumeric chars (except punctuation)
        .replace(/\s+/g, ' ')         // Collapse multiple spaces
        .trim()
        .split(' ')
        .filter(word => word.length > 2)
        .join(' ');
}

/**
 * Processes image using sharp (grayscale, normalize, resize)
 * @param {Buffer} imageData
 * @returns {Promise<Buffer>}
 */
async function processImage(imageData) {
    return sharp(imageData)
        .grayscale()
        .normalize()
        .resize({ width: 1000 })
        .toBuffer();
}

/**
 * Scrapes banner images and extracts OCR text.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<Array<{type: string, content: string, link: string}>>}
 */

async function scrapeBanners(page) {
    // Wait for at least one image in the container to appear
    await page.waitForSelector('.SaleCouponList__Container-sc-ezdcvs-1.iSokNd img[src]', { timeout: 10000 });

    // Extract image data from the container
    const banners = await page.$$eval('.SaleCouponList__Container-sc-ezdcvs-1.iSokNd img[src]', images => {
        const uniqueBanners = new Set();
        return images
            .map(img => ({
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt') || 'No alt text'
            }))
            // If you need specific filters, adjust here. For example, if we only want images from cdn.grofers.com:
            .filter(banner => banner.src.includes('cdn.grofers.com') && banner.src.includes('https'))
            .filter(banner => {
                const identifier = `${banner.src}|${banner.alt}`;
                if (uniqueBanners.has(identifier)) {
                    return false;
                }
                uniqueBanners.add(identifier);
                return true;
            });
    });

    const ads = [];

    for (const banner of banners) {
        // Fetch the image data
        const response = await axios.get(banner.src, { responseType: 'arraybuffer' });
        const processedImage = await processImage(Buffer.from(response.data));

        // Perform OCR on the processed image
        const ocrResult = await Tesseract.recognize(processedImage, 'eng');
        const rawText = ocrResult.data.text;
        const cleaned = cleanText(rawText);

        ads.push({
            type: "banner",
            content: cleaned,
            link: banner.src
        });
    }

    return ads;
}
module.exports = { cleanText, processImage, scrapeBanners };
