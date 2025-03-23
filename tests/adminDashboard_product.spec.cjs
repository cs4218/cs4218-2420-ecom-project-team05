import { test, expect } from '@playwright/test';
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from '../models/productModel.js';

dotenv.config(); // Loads MONGODB_URL from .env

async function deleteProductsByNames(names = []) {
  if (!process.env.MONGO_URL) {
    throw new Error("Missing MONGODB_URL in env");
  }

  await mongoose.connect(process.env.MONGO_URL);

  const result = await Product.deleteMany({
    name: { $in: names },
  });

  await mongoose.disconnect();
  console.log(`Deleted ${result.deletedCount} test products`);
}

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
});

test.describe('CRUD Product', () => {
    test('should allow me to create a new product, update and delete successfully', async ({ page }) => {
        // create product
        try {
            await page.getByRole('link', { name: 'Create Product' }).click();
            await page.locator('#rc_select_0').click();
            await page.getByTitle('Clothing').locator('div').click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('trousers');
            await page.getByRole('textbox', { name: 'Enter a description' }).fill('good trousers');
            await page.getByPlaceholder('Enter a price').fill('15');
            await page.getByPlaceholder('Enter a quantity').fill('46');
            await page.locator('#rc_select_1').click();
            await page.getByText('Yes').click();
            await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
            await expect(
                page.getByRole("heading", { name: "All Products List" })
                ).toBeVisible();
            await expect(page.getByRole("link", { name: 'trousers' })).toBeVisible();
    
            // update product
            await page.getByRole('link', { name: 'trousers' }).click();
            await expect(page.getByPlaceholder('Enter a description')).toContainText('good trousers');
            await page.getByRole('textbox', { name: 'Enter a name' }).click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('long trousers');
            await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
            await page.waitForSelector('text="Product Updated Successfully"');
            await page.getByRole('link', { name: 'Products' }).click();
            await expect(
                page.getByRole("heading", { name: "All Products List" })
                ).toBeVisible();
            await expect(page.getByRole("link", { name: 'long trousers' })).toBeVisible();
    
            // delete product
            await page.getByRole('button', { name: 'Test' }).click();
            await page.getByRole('link', { name: 'Dashboard' }).click();
            await page.getByRole('link', { name: 'Products' }).click();
            await page.getByRole('link', { name: 'long trousers long trousers good trousers' }).click();
            await expect(page.getByRole("textbox", { name: "Enter a name" })).toHaveValue(
                'long trousers'
            );
            page.once("dialog", async (dialog) => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept("Accept");
            });
            await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
            await page.waitForSelector('text="All Products List"');
            await expect(page.getByRole('link', { name: 'long trousers long trousers good trousers' })).not.toBeVisible();
        } finally {
            // clean up
            await deleteProductsByNames([
                "trousers",
                "long trousers"
            ]);
        }
    });

    test('should allow me to create a new product with image and delete successfully', async ({ page }) => {
        // create product
        try {
            await page.getByRole('link', { name: 'Create Product' }).click();
            await page.locator('#rc_select_0').click();
            await page.getByTitle('Clothing').locator('div').click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('jeans');
            await page.getByRole('textbox', { name: 'Enter a description' }).fill('good jeans');
            await page.getByText("Upload Photo").click();
            await page.getByText("Upload Photo").setInputFiles('tests/resources/pants.jpg');
            await page.getByPlaceholder('Enter a price').fill('20');
            await page.getByPlaceholder('Enter a quantity').fill('46');
            await page.locator('#rc_select_1').click();
            await page.getByText('Yes').click();
            await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
            await expect(
                page.getByRole("heading", { name: "All Products List" })
                ).toBeVisible();
            await expect(page.getByRole("link", { name: 'jeans' })).toBeVisible();

            // delete product
            await page.getByRole('link', { name: 'jeans jeans good jeans' }).click();
            await expect(page.getByRole("textbox", { name: "Enter a name" })).toHaveValue(
                'jeans'
            );
            page.once("dialog", async (dialog) => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept("Accept");
            });
            await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
            await page.waitForSelector('text="All Products List"');
            await expect(page.getByRole('link', { name: 'jeans jeans good jeans' })).not.toBeVisible();
        } finally {
            await deleteProductsByNames([
                "jeans"
            ]);
        }
    });

    test('should not allow me to update a product if any field is empty', async ({ page }) => {
        try {
            // create product
            await page.getByRole('link', { name: 'Create Product' }).click();
            await page.locator('#rc_select_0').click();
            await page.getByTitle('Clothing').locator('div').click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
            await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
            await page.getByPlaceholder('Enter a price').fill('20');
            await page.getByPlaceholder('Enter a quantity').fill('46');
            await page.locator('#rc_select_1').click();
            await page.getByText('Yes').click();
            await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
            await expect(
                page.getByRole("heading", { name: "All Products List" })
                ).toBeVisible();
            await expect(page.getByRole("link", { name: 'pants' })).toBeVisible();
        
            // update product
            await page.getByRole('link', { name: 'pants' }).click();
            await expect(page.getByPlaceholder('Enter a description')).toContainText('good pants');
        
            // empty name
            await page.getByRole('textbox', { name: 'Enter a name' }).click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('');
            await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
            await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');

            // empty description
            await page.getByRole('textbox', { name: 'Enter a description' }).click();
            await page.getByRole('textbox', { name: 'Enter a description' }).fill('');
            await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
            await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
        
            // empty price
            await page.getByPlaceholder('Enter a price').click();
            await page.getByPlaceholder('Enter a price').fill('');
            await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
            await page.getByPlaceholder('Enter a price').fill('20');
        
            // empty quantity
            await page.getByPlaceholder('Enter a quantity').click();
            await page.getByPlaceholder('Enter a quantity').fill('');
            await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
            await page.getByPlaceholder('Enter a price').fill('46');

            const errorMessages = page.getByText('Something went wrong');
            const count = await errorMessages.count();    
            expect(count).toBeGreaterThan(0); // Ensure at least one error    

            // delete product
            await page.getByRole('button', { name: 'Test' }).click();
            await page.getByRole('link', { name: 'Dashboard' }).click();
            await page.getByRole('link', { name: 'Products' }).click();
            await page.getByRole('link', { name: 'pants pants good pants' }).click();
            await expect(page.getByRole("textbox", { name: "Enter a name" })).toHaveValue(
                'pants'
            );
            page.once("dialog", async (dialog) => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept("Accept");
            });
            await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
            await page.waitForSelector('text="All Products List"');
            await expect(page.getByRole('link', { name: 'pants pants good pants' })).not.toBeVisible();
        } finally {
            await deleteProductsByNames([
                "pants"
            ]);
        }
    });
});

test("should not create product if name is empty", async ({ page }) => {
    // Go to create product page
    await page.getByRole("link", { name: "Create Product" }).click();
  
    // Fill in the product details
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter a name' }).fill('');
    await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
    await page.getByPlaceholder('Enter a price').fill('20');
    await page.getByPlaceholder('Enter a quantity').fill('46');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  
    // Verify the error message
    await expect(page.getByText('Name is required')).toBeVisible();  
});

test("should not create product if description is empty", async ({ page }) => {
    // Go to create product page
    await page.getByRole("link", { name: "Create Product" }).click();
  
    // Fill in the product details
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
    await page.getByRole('textbox', { name: 'Enter a description' }).fill('');
    await page.getByPlaceholder('Enter a price').fill('20');
    await page.getByPlaceholder('Enter a quantity').fill('46');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  
    // Verify the error message
    await expect(page.getByText('Description is required')).toBeVisible();  
});

test("should not create product if price is empty", async ({ page }) => {
    // Go to create product page
    await page.getByRole("link", { name: "Create Product" }).click();
  
    // Fill in the product details
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
    await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
    await page.getByPlaceholder('Enter a price').fill('');
    await page.getByPlaceholder('Enter a quantity').fill('46');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  
    // Verify the error message
    await expect(page.getByText('Price must be greater than zero')).toBeVisible();  
});

test("should not create product if quantity is empty", async ({ page }) => {
    // Go to create product page
    await page.getByRole("link", { name: "Create Product" }).click();
  
    // Fill in the product details
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
    await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
    await page.getByPlaceholder('Enter a price').fill('20');
    await page.getByPlaceholder('Enter a quantity').fill('');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  
    // Verify the error message
    await expect(page.getByText('Quantity is required')).toBeVisible();  
});

test("should not create product if shipping option is empty", async ({ page }) => {
    // Go to create product page
    await page.getByRole("link", { name: "Create Product" }).click();
  
    // Fill in the product details
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
    await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
    await page.getByPlaceholder('Enter a price').fill('20');
    await page.getByPlaceholder('Enter a quantity').fill('46');

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  
    // Verify the error message
    await expect(page.getByText('Please select a shipping option')).toBeVisible();  
});

test.afterEach(async ({ page }) => {
    // logout
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'Test' }).click();

    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
});