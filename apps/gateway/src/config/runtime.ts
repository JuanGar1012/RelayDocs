const DEV_JWT_SECRET = "relaydocs-dev-secret";

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (typeof secret === "string" && secret.length >= 32 && secret !== "replace-in-production") {
    return secret;
  }

  if (isProductionEnvironment()) {
    throw new Error(
      "JWT_SECRET must be set to a strong value (>=32 chars) when NODE_ENV=production."
    );
  }

  return DEV_JWT_SECRET;
}

export function allowDevTokens(): boolean {
  if (isProductionEnvironment()) {
    return false;
  }

  return process.env.ALLOW_DEV_TOKENS !== "false";
}

