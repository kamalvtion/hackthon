# Web Scraper

This repository contains web scrapers for different platforms, such as Big Basket and Blinkit. Follow the instructions below to set up and run the scrapers.

## Prerequisites

Before setting up the Web Scraper, ensure that you have the following installed on your system:

1. **Node.js (v16.20.0 or higher)**
2. **npm (Node Package Manager)**
3. **Git**

## Setup Instructions

Clone the repository to your local machine:

```bash
git clone https://github.com/kamalvtion/hackthon.git
cd hackathon
```
This project uses a `.env` file to store configuration variables. The `.env` file should be located in the root directory of the project. Below are the variables used in this project:

```env
NEW_PINCODE=110001
PLATFORM=bigbasket
CATEGORY=atta-flours-sooji
DEMOGRAPHY={"age_group":"25-30", "gender":"Male"}
CATEGORY_URL=https://www.bigbasket.com/pc/foodgrains-oil-masala/atta-flours-sooji/
```

#### Changing Variables

If you need to change the variables, follow these steps:

1. Open the `.env` file in any text editor.
2. Update the variable values as needed:
   - `NEW_PINCODE`: Change the location PIN code.
   - `PLATFORM`: Update the platform name.
   - `CATEGORY`: Modify the product category.
   - `DEMOGRAPHY`: Adjust the demographic details (must be in JSON format).
   - `CATEGORY_URL`: Change the URL of the category you want to scrape.
3. Save the file after making the changes.

### Running the Big Basket Scraper

To run the Big Basket scraper, follow these steps:

1. Navigate to the `bigbasket` directory:
   ```bash
   cd bigbasket
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Run the scraper:
   ```bash
   node main.js
   ```
    See the output.json for results
### Running the Blinkit Scraper

To run the Blinkit scraper, follow these steps:

1. Navigate to the `blinkit` directory:
   ```bash
   cd blinkit
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Run the scraper:
   ```bash
   node main.js
   ```

   See the output.json for results

## Notes

- Ensure your system meets the prerequisites before running the scrapers.
- Each scraper has its own dependencies, so you need to install them separately in their respective directories.
- If you encounter any issues, please check the logs for detailed error messages.
