import type { AuthSession } from "../auth/session";

const BASE_URL = import.meta.env.VITE_GATEWAY_BASE_URL ?? "http://localhost:8080";

interface AuthResponse {
  token: string;
  userId: string;
}

interface ErrorPayload {
  message?: string;
}

function parseErrorPayload(value: unknown): ErrorPayload {
  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as { message?: unknown }).message;

    if (typeof message === "string") {
      return { message };
    }
  }

  return {};
}

async function requestAuth(path: "/api/v1/auth/signup" | "/api/v1/auth/login", body: { username: string; password: string }): Promise<AuthSession> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json().catch((): null => null)) as unknown;

  if (!response.ok) {
    const errorPayload = parseErrorPayload(payload);
    throw new Error(errorPayload.message ?? "Authentication failed");
  }

  const authPayload = payload as AuthResponse;
  return {
    token: authPayload.token,
    userId: authPayload.userId
  };
}

export async function signup(username: string, password: string): Promise<AuthSession> {
  return requestAuth("/api/v1/auth/signup", { username, password });
}

export async function login(username: string, password: string): Promise<AuthSession> {
  return requestAuth("/api/v1/auth/login", { username, password });
}
