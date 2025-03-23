import { test, expect} from '@playwright/test';

test.describe('Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('successfully registers a user with valid inputs', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Rachel Green');
    const uniqueEmail = `rach${Date.now()}@gmail.com`;
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Friends123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('+6512345678');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('New York');
    await page.getByPlaceholder('Enter Your DOB').fill('2013-06-22');
    await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('Rugby');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 10000 });
  });

  test('do not fill any fields and submit', async ({ page }) => {
        await page.getByRole('button', { name: 'REGISTER' }).click();
        
        await expect(page.getByText('Name is required')).toBeVisible();
        await expect(page.getByText('Email is required')).toBeVisible();
        await expect(page.getByText('Password is required')).toBeVisible();
        await expect(page.getByText('Phone number is required')).toBeVisible();
        await expect(page.getByText('Address is required')).toBeVisible();
        await expect(page.getByText('Date of birth is required')).toBeVisible();
        await expect(page.getByText('Favorite sport is required')).toBeVisible();
      });

  test.describe('Name validation', () => {
    test('validates minimum name length', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('RA');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Name must be at least 3 characters long')).toBeVisible();
    });

    test('requires at least one letter in name', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('123');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Name must contain at least one letter')).toBeVisible();
    });
  });

  test.describe('Email validation', () => {
    test('requires @ symbol in email', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('racgmail.com');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Email is invalid')).toBeVisible();
    });

    test('requires domain in email', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('racgmail');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Email is invalid')).toBeVisible();
    });

    test('requires dot in email domain', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('rac@gmailcom');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Email is invalid')).toBeVisible();
    });
  });

  test.describe('Password validation', () => {
    test('validates password minimum length', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abc1');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Password must be at least 6 characters long.')).toBeVisible();
    });

    test('requires both letters and numbers in password', async ({ page }) => {
      // Test with letters only
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('aaaabbbbb');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Password must contain at least one letter and one number.')).toBeVisible();
      
      // Test with numbers only
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123456');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Password must contain at least one letter and one number.')).toBeVisible();
    });
  });

  test.describe('Phone validation', () => {
    test('accepts phone numbers with separators', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('+1-234-2678181');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Phone number is too short.')).not.toBeVisible();
    });

    test('validates minimum phone number length', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('123');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Phone number is too short.')).toBeVisible();
    });

    test('validates maximum phone number length', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234637829191717180101');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Phone number is too long.')).toBeVisible();
    });
  });

  test.describe('Date of Birth validation', () => {
    test('validates future dates', async ({ page }) => {
      await page.getByPlaceholder('Enter Your DOB').fill('2026-03-22');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Date of birth cannot be in the future')).toBeVisible();
    });
  });

  test.describe('Favorite Sport validation', () => {
    test('validates minimum sport answer length', async ({ page }) => {
      await page.getByRole('textbox', { name: 'What is Your Favorite Sport?' }).fill('No');
      await page.getByRole('button', { name: 'REGISTER' }).click();
      
      await expect(page.getByText('Favorite sport is too short')).toBeVisible();
    });
  });
});