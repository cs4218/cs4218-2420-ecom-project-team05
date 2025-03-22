import { test, expect } from "@playwright/test";

test.describe("Customer Orders Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("kervynadmin@admin.com");
    await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("kervyn20");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page
      .locator(
        "div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)"
      )
      .click();
    await page.getByRole("link", { name: "Cart" }).click();
    await page.getByRole("button", { name: "Paying with Card" }).click();
    await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .fill("4242424242424242");
    await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .press("Tab");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .fill("01");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .fill("0130");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .press("Tab");
    await page
      .locator(
        "div:nth-child(2) > label > .braintree-form__field > .braintree-form__hosted-field"
      )
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .fill("123");
    await page.getByRole("button", { name: "Make Payment" }).click();
  });

  test("should display orders table", async ({ page }) => {
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("should list orders with status, buyer, date, payment, and quantity", async ({
    page,
  }) => {
    // Check if at least one order exists
    const orders = page.locator("tbody tr").first();
    await expect(orders).toBeVisible();

    // Verify order details
    await expect(
      page.locator('thead th:has-text("Status")').first()
    ).toBeVisible();
    await expect(
      page.locator('thead th:has-text("Buyer")').first()
    ).toBeVisible();
    await expect(
      page.locator('thead th:has-text("date")').first()
    ).toBeVisible();
    await expect(
      page.locator('thead th:has-text("Payment")').first()
    ).toBeVisible();
    await expect(
      page.locator('thead th:has-text("Quantity")').first()
    ).toBeVisible();
  });

  test("should display correct order statuses", async ({ page }) => {
    // Not Process status here since customer cannot edit their own order status
    const statuses = ["Not Process"];
    for (const status of statuses) {
      await expect(
        page.locator(`td:has-text("${status}")`).first()
      ).toBeVisible();
    }
  });

  test("should display product details for each order", async ({ page }) => {
    // Check if at least one product is listed
    const productCards = page.locator(".card").first();
    await expect(productCards).toBeVisible();
  });
});
