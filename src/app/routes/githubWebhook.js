import { webhooks } from "../webhooks.ts";
export async function githubWebhookRoute(req, res) {
    try {
        await webhooks.verifyAndReceive({
            id: req.headers["x-github-delivery"],
            name: req.headers["x-github-event"],
            signature: req.headers["x-hub-signature-256"],
            payload: req.body
        });
        res.status(200).send("OK");
    }
    catch (err) {
        console.error("Webhook error:", err.message);
        res.status(500).send("Webhook handling failed");
    }
}
