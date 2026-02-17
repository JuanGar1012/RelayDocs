import { expect, test } from "@playwright/test";
import { makeCredentials, signupInUi } from "./helpers/auth";

test("create and open a document", async ({ page }) => {
  const title = `Smoke Doc ${Date.now()}`;
  const body = "Smoke test document body";

  await signupInUi(page, makeCredentials("smoke"));
  await page.goto("/documents");

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").first().fill(body);
  const createResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/v1/documents") &&
      response.request().method() === "POST" &&
      response.status() === 201
    );
  });
  await page.getByRole("button", { name: "Create" }).click();
  await createResponsePromise;

  const link = page.getByRole("link", { name: title });
  await expect(link).toBeVisible();
  await link.click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Share Document" })).toBeVisible();
});
