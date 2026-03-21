const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "FRONTEND_URL",
] as const;

const OPTIONAL_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_ENV) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[env] Optional variables missing (some features disabled): ${warnings.join(", ")}`
    );
  }

  if (missing.length > 0) {
    console.error(
      `[env] Required environment variables missing: ${missing.join(", ")}`
    );
    console.error("[env] Check .env.example for required configuration");
    process.exit(1);
  }
}
