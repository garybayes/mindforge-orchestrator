/**
 * githubApp.ts
 * GitHub App authentication helper.
 *
 * Responsible for:
 * - Creating a GitHub App client
 * - Resolving installation IDs
 * - Issuing installation access tokens
 */
import { App } from "@octokit/app";
import { loadEnv } from "../env";
/**
 * Initialize the GitHub App using credentials from env.
 */
export function createGitHubApp() {
    const env = loadEnv();
    const privateKey = env.PRIVATE_KEY.replace(/\\n/g, "\n");
    const app = new App({
        appId: env.APP_ID,
        privateKey,
        webhooks: {
            secret: env.WEBHOOK_SECRET,
        },
    });
    return { app };
}
/**
 * Create an Octokit client authenticated as a specific installation.
 */
export async function getInstallationOctokit(installationId) {
    const { app } = createGitHubApp();
    const octokit = await app.getInstallationOctokit(installationId);
    return octokit;
}
