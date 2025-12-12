import "dotenv/config";

export interface AppEnv {
  APP_ID: string;
  PRIVATE_KEY: string;
  WEBHOOK_SECRET: string;
  PORT: number;
}

export function loadEnv(): AppEnv {
  const { APP_ID, PRIVATE_KEY, WEBHOOK_SECRET, PORT } = process.env;

  if (!APP_ID) throw new Error("Missing APP_ID");
  if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");
  if (!WEBHOOK_SECRET) throw new Error("Missing WEBHOOK_SECRET");

  return {
    APP_ID,
    PRIVATE_KEY,
    WEBHOOK_SECRET,
    PORT: PORT ? parseInt(PORT, 10) : 3000
  };
}
