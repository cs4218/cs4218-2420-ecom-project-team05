const { test, expect } = require('@playwright/test');

import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import dotenv from "dotenv"; 

dotenv.config(); 

let testCategory;
let testProducts = [];

test.describe.serial('Homepage', () => {
  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
  
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category'
    });
  
    const seedProducts = [
      { name: 'Product 1', slug: 'product-1', price: 10 },
      { name: 'Product 2', slug: 'product-2', price: 25 },
      { name: 'Product 3', slug: 'product-3', price: 45 },
      { name: 'Product 4', slug: 'product-4', price: 65 },
      { name: 'Product 5', slug: 'product-5', price: 88 },
      { name: 'Product 6', slug: 'product-6', price: 150 },
    ];
  
    testProducts = await Product.insertMany(
      seedProducts.map(p => ({
        ...p,
        description: `${p.name} description`,
        category: testCategory._id,
        quantity: 100,
        shipping: true
      }))
    );
  });
  
  test.afterAll(async () => {
    const ids = testProducts.map(p => p._id);
    await Product.deleteMany({ _id: { $in: ids } }); // removes seeded test products
    await Category.findByIdAndDelete(testCategory._id); // removes the test category
    await mongoose.connection.close(); // closes DB connection
  });
  
  test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/');
    });
  
  test('homepage loads and displays content correctly', async ({ page }) => {  
      // Verify the banner image
      await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  });
  
  test('view product details', async ({ page }) => {
    await page.locator('.card-name-price > button').first().click();
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible()
  });
  
  
  test('category browsing', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Test Category' }).click();
    await expect(page.getByRole('heading', { name: 'Category - Test Category' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'result found' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product 1' })).toBeVisible();
  
  });
  
  test('search products from navbar and view details', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('t-shirt');
    await page.getByRole('button', { name: 'Search' }).click();
  
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
  
    await page.getByRole('button', { name: 'More Details' }).click();
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
  });
  
  test('filter by price', async ({ page }) => {
    await page.getByText('$0 to').click();
    await expect(page.getByRole('heading', { name: 'Product 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$10' })).toBeVisible();
  
    await page.getByText('$20 to').click();
    await expect(page.getByRole('heading', { name: 'Product 2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$25' })).toBeVisible();
  
    await page.getByText('$40 to').click();
    await expect(page.getByRole('heading', { name: 'Product 3' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$45' })).toBeVisible();
  
    await page.getByText('$60 to').click();
    await expect(page.getByRole('heading', { name: 'Product 4' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$65' })).toBeVisible();
  
    await page.getByText('$80 to').click();
    await expect(page.getByRole('heading', { name: 'Product 5' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$88' })).toBeVisible();
    
    await page.getByText('$100 or').click();
    const productHeading = page.locator('role=heading[name="Product 6"]');
    await productHeading.waitFor({ state: 'visible', timeout: 10000 }); // Wait up to 10 seconds
    
    // Now assert that the heading is visible
    await expect(productHeading).toBeVisible();
  });    
})