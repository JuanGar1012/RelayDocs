import { expect, type APIRequestContext, type Page } from "@playwright/test";

export interface AuthSession {
  token: string;
  userId: string;
}

interface AuthPayload {
  token: string;
  userId: string;
}

const JSON_HEADERS = {
  "content-type": "application/json"
} as const;

function randomSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function makeCredentials(prefix: string): { username: string; password: string } {
  return {
    username: `${prefix}-${randomSuffix()}`,
    password: `P@ssword-${randomSuffix()}`
  };
}

async function readAuthResponse(response: Awaited<ReturnType<APIRequestContext["post"]>>): Promise<AuthSession> {
  const payload = (await response.json()) as AuthPayload;
  return {
    token: payload.token,
    userId: payload.userId
  };
}

export async function signupViaApi(
  request: APIRequestContext,
  credentials: { username: string; password: string }
): Promise<AuthSession> {
  const response = await request.post("/api/v1/auth/signup", {
    headers: JSON_HEADERS,
    data: credentials
  });
  expect(response.status()).toBe(201);
  return readAuthResponse(response);
}

export function authHeaders(token: string): Record<string, string> {
  return {
    ...JSON_HEADERS,
    authorization: `Bearer ${token}`
  };
}

export async function signupInUi(
  page: Page,
  credentials: { username: string; password: string }
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(`Signed in as ${credentials.username}`)).toBeVisible();
}

export async function loginInUi(
  page: Page,
  credentials: { username: string; password: string }
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.locator("form").getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(`Signed in as ${credentials.username}`)).toBeVisible();
}

export async function readSessionFromUi(page: Page): Promise<AuthSession> {
  const raw = await page.evaluate(() => window.localStorage.getItem("relaydocs.auth.session"));
  expect(raw).not.toBeNull();
  return JSON.parse(raw as string) as AuthSession;
}
