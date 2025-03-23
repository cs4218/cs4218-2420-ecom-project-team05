import { test } from "@playwright/test";

test.describe("Admin Orders Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("kervynwork@gmail.com");
    await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("kervyn20");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "kervyn" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();
  });

  test("should be able to change order status", async ({ page }) => {
    await page.waitForTimeout(5000);
    await page
      .getByRole("row", {
        name: "Not Processed CS 4218 Test Account 23-03-2025, 12:43 PM Success 2",
      })
      .locator("span")
      .nth(1)
      .click();
    await page.locator(".ant-select-item-option-content").first().click();
  });
});
