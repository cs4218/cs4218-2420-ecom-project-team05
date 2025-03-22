import { test, expect } from '@playwright/test';

test.describe('Forgot Password Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/forgot-password');
  });

  test('should successfully reset password with valid inputs', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('mongo@gmail.com');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('None');
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('Pass123');
    
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Password Reset Successfully')).toBeVisible();
    
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    
    // Login with new password
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('mongo@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Pass123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.getByText('login successfully')).toBeVisible();
  });

  test('should show error when using invalid email', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('abc123@abc.com');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('Golf');
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('Pass123');
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Wrong Email Or Answer')).toBeVisible();
  });

  test('should show error when providing invalid answer', async ({ page }) => {
    // Fill form with valid email but wrong answer
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('rach@gmail.com');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('golf');
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('Pass123');
    
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Wrong Email Or Answer')).toBeVisible();
  });

  test('should validate password minimum length', async ({ page }) => {
    // Fill email and answer correctly
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('rach@gmail.com');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('Rugby');
    
    // Enter too short password
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('aaa');
    
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible();
  });

  test('should validate password contains letters and numbers', async ({ page }) => {
    // Fill email and answer correctly
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('rach@gmail.com');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('Rugby');
    
    // Enter password with only letters
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('aaaaaaaaaaaaaa');
    
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Password must contain at least one letter and one number')).toBeVisible();

    // Enter password with only numbers
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('111111111111');
    
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    await expect(page.getByText('Password must contain at least one letter and one number')).toBeVisible();
  });
});