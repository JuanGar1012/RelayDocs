import { expect, test } from "@playwright/test";
import {
  authHeaders,
  loginInUi,
  makeCredentials,
  readSessionFromUi,
  signupInUi,
  signupViaApi
} from "./helpers/auth";

test("signup/login with RBAC and two-user update sequencing", async ({ browser, request }) => {
  const ownerCredentials = makeCredentials("rbac-owner");
  const collaboratorCredentials = makeCredentials("rbac-collab");

  const ownerContext = await browser.newContext();
  const collaboratorContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const collaboratorPage = await collaboratorContext.newPage();

  try {
    await signupInUi(ownerPage, ownerCredentials);
    const collaboratorSession = await signupViaApi(request, collaboratorCredentials);

    await ownerPage.goto("/documents");

    const title = `RBAC Flow ${Date.now()}`;
    const initialBody = "owner baseline";
    await ownerPage.getByLabel("Title").fill(title);
    await ownerPage.getByLabel("Content").first().fill(initialBody);
    await ownerPage.getByRole("button", { name: "Create" }).click();
    await expect(ownerPage.getByRole("link", { name: title })).toBeVisible();
    await ownerPage.getByRole("link", { name: title }).click();
    await expect(ownerPage.getByRole("heading", { name: title })).toBeVisible();

    await ownerPage.getByLabel("User ID").fill(collaboratorSession.userId);
    await ownerPage.getByLabel("Role").selectOption("viewer");
    await ownerPage.getByRole("button", { name: "Share" }).click();
    await expect(ownerPage.getByLabel(`Role for ${collaboratorSession.userId}`)).toHaveValue("viewer");

    const currentUrl = ownerPage.url();
    const documentId = currentUrl.substring(currentUrl.lastIndexOf("/") + 1);

    await loginInUi(collaboratorPage, collaboratorCredentials);
    await collaboratorPage.goto(`/documents/${documentId}`);
    await collaboratorPage.getByLabel("New content").fill("viewer should not edit");
    await collaboratorPage.getByRole("button", { name: "Save" }).click();
    await expect(collaboratorPage.getByText("You do not have access to edit this document.")).toBeVisible();

    await ownerPage.getByLabel(`Role for ${collaboratorSession.userId}`).selectOption("editor");
    await expect(ownerPage.getByLabel(`Role for ${collaboratorSession.userId}`)).toHaveValue("editor");

    const ownerSession = await readSessionFromUi(ownerPage);

    const ownerUpdate = await request.patch(`/api/v1/documents/${documentId}`, {
      headers: authHeaders(ownerSession.token),
      data: { content: "owner update" }
    });
    expect(ownerUpdate.status()).toBe(200);

    const collaboratorUpdate = await request.patch(`/api/v1/documents/${documentId}`, {
      headers: authHeaders(collaboratorSession.token),
      data: { content: "collaborator update" }
    });
    expect(collaboratorUpdate.status()).toBe(200);

    await collaboratorPage.reload();
    await expect(collaboratorPage.getByText("collaborator update")).toBeVisible();
  } finally {
    await ownerContext.close();
    await collaboratorContext.close();
  }
});
