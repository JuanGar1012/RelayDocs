import { expect, test } from "@playwright/test";

test("create and open a document", async ({ page }) => {
  const title = `Smoke Doc ${Date.now()}`;
  const body = "Smoke test document body";

  await page.goto("/documents");

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").first().fill(body);
  await page.getByRole("button", { name: "Create" }).click();

  const link = page.getByRole("link", { name: title });
  await expect(link).toBeVisible();
  await link.click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Share Document" })).toBeVisible();
});
