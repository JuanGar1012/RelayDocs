import { expect, test } from "@playwright/test";
import { authHeaders, makeCredentials, signupViaApi } from "./helpers/auth";

test("viewer cannot edit a shared document", async ({ request }) => {
  const owner = await signupViaApi(request, makeCredentials("negative-owner"));
  const viewer = await signupViaApi(request, makeCredentials("negative-viewer"));

  const created = await request.post("/api/v1/documents", {
    headers: authHeaders(owner.token),
    data: {
      title: `Restricted Doc ${Date.now()}`,
      content: "Owner only"
    }
  });
  expect(created.status()).toBe(201);
  const createdPayload = (await created.json()) as { document: { id: number } };
  const documentId = createdPayload.document.id;

  const shared = await request.post(`/api/v1/documents/${documentId}/share`, {
    headers: authHeaders(owner.token),
    data: {
      userId: viewer.userId,
      role: "viewer"
    }
  });
  expect(shared.status()).toBe(200);

  const attemptedUpdate = await request.patch(`/api/v1/documents/${documentId}`, {
    headers: authHeaders(viewer.token),
    data: {
      content: "viewer edit attempt"
    }
  });
  expect(attemptedUpdate.status()).toBe(403);
});

test("malformed document id returns 400", async ({ request }) => {
  const owner = await signupViaApi(request, makeCredentials("negative-malformed"));
  const response = await request.get("/api/v1/documents/not-a-number", {
    headers: authHeaders(owner.token)
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    message: "Invalid request"
  });
});

test("owner cannot share document with self", async ({ request }) => {
  const owner = await signupViaApi(request, makeCredentials("negative-self-share"));
  const created = await request.post("/api/v1/documents", {
    headers: authHeaders(owner.token),
    data: {
      title: `Self Share ${Date.now()}`,
      content: "test"
    }
  });
  expect(created.status()).toBe(201);
  const createdPayload = (await created.json()) as { document: { id: number } };
  const documentId = createdPayload.document.id;

  const shareSelf = await request.post(`/api/v1/documents/${documentId}/share`, {
    headers: authHeaders(owner.token),
    data: {
      userId: owner.userId,
      role: "viewer"
    }
  });

  expect(shareSelf.status()).toBe(400);
  await expect(shareSelf.json()).resolves.toMatchObject({
    message: "Invalid request"
  });
});
