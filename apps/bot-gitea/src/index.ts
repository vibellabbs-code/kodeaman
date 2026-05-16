import { createHmac, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { GiteaPRHandler } from "./handler.js";

const app = new Hono();
const handler = new GiteaPRHandler();

const WEBHOOK_SECRET = process.env.GITEA_WEBHOOK_SECRET || "";

function isValidSignature(body: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!signature) return false;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

app.post("/webhook", async (c) => {
  const rawBody = await c.req.text();

  if (!isValidSignature(rawBody, c.req.header("X-Gitea-Signature"))) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  const event = c.req.header("X-Gitea-Event") || c.req.header("X-Forgejo-Event");
  if (event !== "pull_request") {
    return c.json({ message: "Event ignored" }, 200);
  }

  const body = JSON.parse(rawBody);

  if (!body.pull_request || !["opened", "synchronized"].includes(body.action)) {
    return c.json({ message: "Action ignored" }, 200);
  }

  handler.handlePullRequest(body).catch((err) => {
    console.error("Failed to handle pull request:", err);
  });

  return c.json({ message: "Processing" }, 202);
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "kodeaman-bot-gitea" });
});

const port = Number(process.env.PORT) || 3000;
console.log(`KodeAman Gitea/Forgejo bot listening on port ${port}`);
serve({ fetch: app.fetch, port });
