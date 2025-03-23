import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('login user with valid credentials', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('mongo@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Pass123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page).toHaveURL('http://localhost:3000', { timeout: 10000 });
    await expect(page.getByText('login successfully')).toBeVisible();
  });

  test('should show error for non-existent user email', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('abc@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Pass123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should show error for invalid password with valid email format', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('abc@abc.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Pass123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});