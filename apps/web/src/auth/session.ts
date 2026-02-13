export interface AuthSession {
  token: string;
  userId: string;
}

const SESSION_STORAGE_KEY = "relaydocs.auth.session";

function parseStoredSession(value: string): AuthSession | null {
  try {
    const parsed = JSON.parse(value) as { token?: unknown; userId?: unknown };

    if (typeof parsed.token !== "string" || parsed.token.trim().length === 0) {
      return null;
    }

    if (typeof parsed.userId !== "string" || parsed.userId.trim().length === 0) {
      return null;
    }

    return {
      token: parsed.token,
      userId: parsed.userId
    };
  } catch {
    return null;
  }
}

export function inferUserIdFromToken(token: string): string {
  if (token.startsWith("dev-token-")) {
    const userId = token.slice("dev-token-".length).trim();
    if (userId.length > 0) {
      return userId;
    }
  }

  return "jwt-user";
}

export function readAuthSession(): AuthSession | null {
  const sessionValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (sessionValue) {
    return parseStoredSession(sessionValue);
  }

  return null;
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAuthToken(): string {
  const session = readAuthSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return session.token;
}
