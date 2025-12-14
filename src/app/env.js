import "dotenv/config";
/**
 * Load and validate environment variables.
 * Fails fast with clear errors.
 */
export function loadEnv() {
    const { APP_ID, PRIVATE_KEY, WEBHOOK_SECRET, PORT, NODE_ENV } = process.env;
    if (!APP_ID) {
        throw new Error("Missing APP_ID (GitHub App ID)");
    }
    if (!PRIVATE_KEY) {
        throw new Error("Missing PRIVATE_KEY (GitHub App private key)");
    }
    if (!WEBHOOK_SECRET) {
        throw new Error("Missing WEBHOOK_SECRET (GitHub webhook secret)");
    }
    const parsedAppId = Number(APP_ID);
    if (Number.isNaN(parsedAppId)) {
        throw new Error("APP_ID must be a number");
    }
    const parsedPort = PORT ? parseInt(PORT, 10) : 3000;
    const env = (NODE_ENV ?? "production");
    if (!["development", "production", "test"].includes(env)) {
        throw new Error("NODE_ENV must be one of: development | production | test");
    }
    return {
        GITHUB_APP_ID: parsedAppId,
        GITHUB_APP_PRIVATE_KEY: PRIVATE_KEY,
        GITHUB_WEBHOOK_SECRET: WEBHOOK_SECRET,
        PORT: parsedPort,
        NODE_ENV: env
    };
}
