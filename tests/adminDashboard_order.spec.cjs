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
    await page.getByRole("button", { name: "kervyn" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();
  });

  test("should be able to change order status", async ({ page }) => {
    await page
      .locator("div")
      .filter({
        hasText:
          "#StatusBuyer datePaymentQuantity1Not Processkervynadmina few seconds",
      })
      .nth(4)
      .click();
    await page
      .getByRole("row", { name: "1 Not Process kervynadmin a" })
      .locator("span")
      .nth(1)
      .click();
    await page.getByTitle("Processing").locator("div").click();
    await page
      .getByRole("row", { name: "2 Not Process kervynadmin a" })
      .locator("span")
      .nth(1)
      .click();
    await page.getByText("Cancelled").nth(3).click();
  });
});
