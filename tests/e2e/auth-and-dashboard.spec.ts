import { test, expect } from "@playwright/test";

test("user can register and land on dashboard", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e_${unique}@example.com`;

  await page.goto("/auth/register");

  const inputs = page.locator("input");
  await inputs.nth(0).fill("E2E User");
  await inputs.nth(1).fill(email);
  await inputs.nth(2).fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Your boards" }),
  ).toBeVisible();
});

test("signed-in user can create a board from dashboard", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e_create_${unique}@example.com`;

  await page.goto("/auth/register");
  const inputs = page.locator("input");
  await inputs.nth(0).fill("Board Creator");
  await inputs.nth(1).fill(email);
  await inputs.nth(2).fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "+ New board" }).click();
  await page
    .getByPlaceholder("e.g. Sprint 42, Marketing Launch...")
    .fill("E2E New Board");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByRole("link", { name: /E2E New Board/ })).toBeVisible();
});
