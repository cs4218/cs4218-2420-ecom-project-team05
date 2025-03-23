import { test, expect } from '@playwright/test';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category');
    await page.getByPlaceholder('Email').fill('mongo@gmail.com');
    await page.getByPlaceholder('Password').fill('Pass123');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  test('should display error when submitting empty category name', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page.getByRole('textbox', { name: 'Enter new category' }).fill('');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByText('Category name is required')).toBeVisible();
  });

  test('should create and then edit a category', async ({ page }) => {
    // Create a new category
    const testCategoryName = 'Test Category ' + Date.now(); // to make each category unique to make edit function work

    await page.getByTestId('category-input').click();
    await page.getByTestId('category-input').fill(testCategoryName);
    await page.getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByText(`${testCategoryName} is created`)).toBeVisible();
    
    // Edit category
    const categoryRow = page.getByRole('row').filter({ hasText: testCategoryName });
    await categoryRow.getByRole('button', { name: 'Edit' }).click();
    
    const editedName = testCategoryName + ' Edited';
    await page.getByTestId('modal').getByTestId('category-input').click();
    await page.getByTestId('modal').getByTestId('category-input').fill(editedName);
    await page.getByTestId('modal').getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
    await expect(page.getByText(`${editedName} is updated`)).toBeVisible();
  });
  
  test('should delete a category successfully', async ({ page }) => {
    // Create a new category to make sure we have something to delete
    const testCategoryName = 'Test Category ' + Date.now(); // unique name
    
    await page.getByTestId('category-input').click();
    await page.getByTestId('category-input').fill(testCategoryName);
    await page.getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByText(`${testCategoryName} is created`)).toBeVisible();
    
    // Delete the category
    const row = page.getByRole('row').filter({ hasText: testCategoryName });
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    
    await deleteButton.click();
    await expect(page.getByText("Category Deleted Successfully")).toBeVisible();
    
    await expect(page.getByRole('cell', { name: testCategoryName })).not.toBeVisible();
  });
});