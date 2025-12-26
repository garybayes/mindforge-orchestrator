declare module "task-assistant-core" {
  export function runCore(input: {
    owner: string;
    repo: string;
    issue: any;
    githubToken?: string;
  }): Promise<any>;
}
