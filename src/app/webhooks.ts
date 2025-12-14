// src/app/webhooks.ts

import { Webhooks } from "@octokit/webhooks";
import type { Octokit } from "octokit";
import { App } from "@octokit/app";
import { loadEnv } from "./env.js";
import { dispatchIssueEvent } from "./dispatcher.js";

const env = loadEnv();

/**
 * GitHub App instance
 * Used to generate installation-scoped Octokit clients
 */
export const githubApp = new App({
  appId: env.GITHUB_APP_ID,                // ✅ MUST be number
  privateKey: env.GITHUB_APP_PRIVATE_KEY,  // ✅ PEM string
  webhooks: {
    secret: env.GITHUB_WEBHOOK_SECRET
  }
});

/**
 * Webhook handler
 */
export const webhooks = new Webhooks({
  secret: env.GITHUB_WEBHOOK_SECRET
});

/**
 * Issue event handler
 */
webhooks.on("issues", async ({ payload }) => {
  const { repository, installation } = payload;

  if (!repository || !installation) {
    throw new Error("Missing repository or installation in webhook payload");
  }

  // Installation-scoped Octokit
  const octokit = await githubApp.getInstallationOctokit(
    installation.id
  );

  const owner = repository.owner.login;
  const repo = repository.name;

  await dispatchIssueEvent(
    { owner, repo },
    payload
  );
});
