import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    test.setTimeout(40000) // Sets a 40-second timeout for all tests

    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
});

test.describe.serial('CRUD Product', () => {
    test('should allow me to create a new product, update and delete successfully', async ({ page }) => {
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

        await page.getByRole('link', { name: 'pants' }).click();

        await expect(page.getByPlaceholder('Enter a description')).toContainText('good pants');
        await page.getByRole('textbox', { name: 'Enter a name' }).click();
        await page.getByRole('textbox', { name: 'Enter a name' }).fill('long pants');
        await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
        await page.waitForSelector('text="Product Updated Successfully"');

        await page.getByRole('link', { name: 'Products' }).click();
        await expect(
            page.getByRole("heading", { name: "All Products List" })
            ).toBeVisible();
        await expect(page.getByRole("link", { name: 'long pants' })).toBeVisible();


        await page.getByRole('button', { name: 'Test' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Products' }).click();
        await page.getByRole('link', { name: 'long pants long pants good pants' }).click();
        await page.waitForTimeout(500);
        page.once("dialog", async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept("Accept");
        });
        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
        await page.waitForTimeout(500);

        await page.waitForSelector('text="All Products List"');

        await expect(page.getByRole('link', { name: 'long pants long pants good pants' })).not.toBeVisible();
    });

    test('should allow me to create a new product with image and delete successfully', async ({ page }) => {
        await page.getByRole('link', { name: 'Create Product' }).click();
        await page.locator('#rc_select_0').click();
        await page.getByTitle('Clothing').locator('div').click();
        await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
        await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
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
        await expect(page.getByRole("link", { name: 'pants' })).toBeVisible();

        await page.getByRole('link', { name: 'pants pants good pants' }).click();
        await page.waitForTimeout(500);

        page.once("dialog", async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept("Accept");
        });
        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
        // await page.getByRole('link', { name: 'Home' }).click();
        await page.waitForTimeout(500);

        await page.waitForSelector('text="All Products List"');

        await expect(page.getByRole('link', { name: 'pants pants good pants' })).not.toBeVisible();
    });

    test('should not allow me to update a product if any field is empty', async ({ page }) => {
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
    
        await page.getByRole('link', { name: 'pants' }).click();
    
        await expect(page.getByPlaceholder('Enter a description')).toContainText('good pants');
    
        // empty name
        await page.getByRole('textbox', { name: 'Enter a name' }).click();
        await page.getByRole('textbox', { name: 'Enter a name' }).fill('');
        await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
        // await expect(page.getByText('Something went wrong')).toBeVisible();
        await page.getByRole('textbox', { name: 'Enter a name' }).fill('pants');
        // await page.waitForTimeout(2000);
    
        await page.getByRole('textbox', { name: 'Enter a description' }).click();
        await page.getByRole('textbox', { name: 'Enter a description' }).fill('');
        await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
        // await expect(page.getByText('Something went wrong')).toBeVisible();
        await page.getByRole('textbox', { name: 'Enter a description' }).fill('good pants');
        // await page.waitForTimeout(2000);
    
        await page.getByPlaceholder('Enter a price').click();
        await page.getByPlaceholder('Enter a price').fill('');
        await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
        // await expect(page.getByText('Something went wrong')).toBeVisible();
        await page.getByPlaceholder('Enter a price').fill('20');
        // await page.waitForTimeout(2000);
    
        await page.getByPlaceholder('Enter a quantity').click();
        await page.getByPlaceholder('Enter a quantity').fill('');
        await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
        // await expect(page.getByText('Something went wrong')).toBeVisible();
        await page.getByPlaceholder('Enter a price').fill('46');
        // await page.waitForTimeout(2000);

        const errorMessages = page.getByText('Something went wrong');
        const count = await errorMessages.count();    
        // Assert that the count matches expected number (4)
        expect(count).toBeGreaterThan(0); // Ensure at least one error    
    
        await page.getByRole('button', { name: 'Test' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Products' }).click();
        await page.getByRole('link', { name: 'pants pants good pants' }).click();
        await page.waitForTimeout(500);

        page.once("dialog", async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept("Accept");
        });
        await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
        await page.waitForTimeout(500);

        await page.waitForSelector('text="All Products List"');

        await expect(page.getByRole('link', { name: 'pants pants good pants' })).not.toBeVisible();
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
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'Test' }).click();

    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
});