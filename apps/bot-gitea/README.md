# KodeAman Gitea and Forgejo Bot

Webhook bot that scans Gitea and Forgejo pull requests with KodeAman and posts a persistent security report comment back to the pull request.

## What it does

- Receives `pull_request` webhooks from Gitea or Forgejo at `POST /webhook`.
- Validates `X-Gitea-Signature` with HMAC-SHA256 when `GITEA_WEBHOOK_SECRET` is configured.
- Clones the pull request head branch into a temporary directory.
- Loads the repository KodeAman configuration and runs either the standard scan pipeline or OWASP scan mode.
- Renders the findings as Markdown and creates or updates one pull request comment marked with `<!-- kodeaman-security-report -->`.
- Exposes `GET /health` for container and platform health checks.

Forgejo is API-compatible with Gitea for this bot, including the pull request webhook shape and issue comment API.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GITEA_TOKEN` | Yes | Gitea or Forgejo API token with permission to read repositories and write issue comments. |
| `GITEA_API_URL` | No | Base REST API URL. Defaults to `https://gitea.com/api/v1`. For self-hosted instances use `https://git.example.com/api/v1`. |
| `GITEA_WEBHOOK_SECRET` | Recommended | Shared webhook secret used to validate the `X-Gitea-Signature` HMAC-SHA256 header. If unset, signature validation is skipped. |
| `PORT` | No | HTTP listen port. Defaults to `3000`. |

## Webhook setup

1. Create an API token in Gitea or Forgejo with repository read access and issue comment write access.
2. Deploy the bot with `GITEA_TOKEN`, `GITEA_API_URL`, and `GITEA_WEBHOOK_SECRET` set.
3. In the repository settings, add a webhook pointing to:

```text
https://your-bot.example.com/webhook
```

4. Select the `Pull Request` event.
5. Configure the webhook secret to match `GITEA_WEBHOOK_SECRET`.
6. Save the webhook and use the test delivery feature or open a pull request.

The bot responds immediately with `202 Processing` and runs the scan asynchronously.

## Local development

```bash
pnpm install
pnpm --filter @kodeaman/bot-gitea build
GITEA_TOKEN=your-token \
GITEA_API_URL=https://git.example.com/api/v1 \
GITEA_WEBHOOK_SECRET=your-secret \
pnpm --filter @kodeaman/bot-gitea start
```

## Docker deployment

Build from the repository root using your existing monorepo Docker workflow, then run the bot with the same environment variables:

```bash
docker run --rm -p 3000:3000 \
  -e GITEA_TOKEN=your-token \
  -e GITEA_API_URL=https://git.example.com/api/v1 \
  -e GITEA_WEBHOOK_SECRET=your-secret \
  kodeaman-bot-gitea
```

Health checks can call:

```text
GET /health
```

Expected response:

```json
{"status":"ok","service":"kodeaman-bot-gitea"}
```

## Comment behavior

Gitea and Forgejo expose pull request comments through the issue comments API:

```text
/repos/{owner}/{repo}/issues/{index}/comments
```

Pull request numbers are issue indexes in this API. The bot searches the first 100 comments for the KodeAman marker and updates that comment when it exists. If no marked comment exists, it creates a new one.
