import { test, expect } from '@playwright/test';

test("should allow me to navigate to footer pages when clicked", async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('text="All Products"');

    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page.getByRole('heading', { name: 'CONTACT US' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('img', { name: 'about us' })).toBeVisible();

    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page.getByRole('img', { name: 'policy' })).toBeVisible();
})

test("should allow me to navigate between pages as a user", async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('text="All Products"');

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@user.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.waitForSelector('text="All Products"');

    await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'All Categories' })).toBeVisible();

    await page.getByRole('button', { name: 'user' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - main:
        - heading "Dashboard" [level=4]
        - link "Profile"
        - link "Orders"
        - heading "user" [level=3]
        - heading "user@user.com" [level=3]
        - heading /\\d+ user/ [level=3]
        `);

    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.locator('h1')).toContainText('Hello user');
    await expect(page.getByRole('heading', { name: 'Cart Summary' })).toBeVisible();

    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('button', { name: 'user' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - heading "LOGIN FORM" [level=4]
        - textbox "Enter Your Email"
        - textbox "Enter Your Password"
        - button "Forgot Password"
        - button "LOGIN"
        `);
})

test("should allow me to navigate between pages as a guest", async ({ page }) => {
    await page.waitForTimeout(500);
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('text="All Products"');

    await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'All Categories' })).toBeVisible();

    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: 'REGISTER FORM' })).toBeVisible();

    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();

    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.locator('h1')).toContainText('Hello Guest');
})

test("should display error page when page not found", async({ page }) => {
    await page.goto('http://localhost:3000/random')
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - heading /\\d+/ [level=1]
        - heading "Oops ! Page Not Found" [level=2]
        - link "Go Back"
        `);
})