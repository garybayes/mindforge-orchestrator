import { Webhooks } from "@octokit/webhooks";
import { App } from "octokit";
import { loadEnv } from "./env";
import { dispatchIssueEvent } from "./dispatcher";

const env = loadEnv();

export const app = new App({
  appId: env.APP_ID,
  privateKey: env.PRIVATE_KEY,
  webhooks: {
    secret: env.WEBHOOK_SECRET
  }
});

export const webhooks = new Webhooks({
  secret: env.WEBHOOK_SECRET
});

// Handle incoming issue events
webhooks.on("issues", async (event) => {
  const { repository, installation, payload } = event;

  const octokit = await app.getInstallationOctokit(
    installation.id
  );

  const owner = repository.owner.login;
  const repo = repository.name;

  await dispatchIssueEvent(
    { octokit, owner, repo },
    payload
  );
});
