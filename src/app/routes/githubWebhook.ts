import type { Request, Response } from "express";
import { webhooks } from "../webhooks.ts";

export async function githubWebhookRoute(req: Request, res: Response) {
  try {
    await webhooks.verifyAndReceive({
      id: req.headers["x-github-delivery"] as string,
      name: req.headers["x-github-event"] as string,
      signature: req.headers["x-hub-signature-256"] as string,
      payload: req.body
    });

    res.status(200).send("OK");
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    res.status(500).send("Webhook handling failed");
  }
}
