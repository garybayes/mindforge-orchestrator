import { runCore } from "mindforge-orchestrator-core";
import type { Octokit } from "octokit";

interface DispatchContext {
  octokit: Octokit;
  owner: string;
  repo: string;
}

export async function dispatchIssueEvent(
  ctx: DispatchContext,
  payload: any
) {
  return runCore({
    octokit: ctx.octokit,
    owner: ctx.owner,
    repo: ctx.repo,
    issue: payload.issue
  });
}
