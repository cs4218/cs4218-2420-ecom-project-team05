import { test, expect } from '@playwright/test';

test.setTimeout(30000);

test.describe('Category Management', () => {
  test.use({ expect: { timeout: 10000 } });

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

  test('should create, edit and delete a category', async ({ page }) => {
    // Step 1: Create a new category
    const testCategoryName = 'Test Category ' + Date.now(); // to make each category unique to make edit function work

    await page.getByTestId('category-input').click();
    await page.getByTestId('category-input').fill(testCategoryName);
    await page.getByRole('button', { name: 'Submit' }).click();
    
    await expect(page.getByText(`${testCategoryName} is created`)).toBeVisible();
    
    // Step 2: Edit category
    const categoryRow = page.getByRole('row').filter({ hasText: testCategoryName });
    await categoryRow.getByRole('button', { name: 'Edit' }).click();
    
    const editedName = testCategoryName + ' Edited';
    await page.getByTestId('modal').getByTestId('category-input').click();
    await page.getByTestId('modal').getByTestId('category-input').fill(editedName);
    await page.getByTestId('modal').getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);
    
    await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
    await expect(page.getByText(`${editedName} is updated`)).toBeVisible();

    // Step 3: Delete the edited category
    const editedRow = page.getByRole('row').filter({ hasText: editedName });
    const deleteButton = editedRow.getByRole('button', { name: 'Delete' });
    
    await deleteButton.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Category Deleted Successfully")).toBeVisible();
    
    await expect(page.locator(`text="${editedName}"`)).not.toBeVisible();
  });

  test('should display error when category with products is trying to be deleted', async ({ page }) => {
        const booksRow = page.getByRole('row').filter({ hasText: 'Books' });
        await booksRow.getByRole('button', { name: 'Delete' }).click();

        await page.waitForTimeout(2000);
        
        await expect(page.getByText("Error while deleting category, category belongs to existing product")).toBeVisible();
  })
});