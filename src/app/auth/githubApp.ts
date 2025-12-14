// src/app/auth/githubApp.ts

import { App } from "@octokit/app";
import { loadEnv } from "../env.js";

const env = loadEnv();

/**
 * Normalize private key for runtime usage
 * (GitHub provides it with escaped newlines)
 */
const privateKey = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");

/**
 * GitHub App instance
 */
export const githubApp = new App({
  appId: env.GITHUB_APP_ID,
  privateKey,
  webhooks: {
    secret: env.GITHUB_WEBHOOK_SECRET
  }
});
