import { runCore } from "task-assistant-core";
export async function dispatchIssueEvent(ctx, payload) {
    return runCore({
        owner: ctx.owner,
        repo: ctx.repo,
        issue: payload.issue,
        githubToken: installationToken
    });
}
