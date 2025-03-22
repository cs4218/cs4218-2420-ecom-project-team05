const { test, expect } = require('@playwright/test');

test.beforeEach('login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
});

test('profile view and logout', async({ page }) => {
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Name : Test' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Email : test@admin.com' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Contact : test@admin.com' })).toBeVisible();

    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
}); 
