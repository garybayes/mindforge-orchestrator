// src/app/dispatcher.ts

import type { Octokit } from "octokit";
import { runCore } from "task-assistant-core";

export interface DispatchContext {
  owner: string;
  repo: string;
}

export async function dispatchIssueEvent(
  ctx: DispatchContext,
  payload: any
) {
  const { owner, repo } = ctx;

  if (!payload.issue) {
    return;
  }

  await runCore({
    owner,
    repo,
    issue: payload.issue,
    githubToken: undefined // installation token already bound
  });
}
