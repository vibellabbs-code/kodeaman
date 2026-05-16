import type { GiteaComment } from "./types.js";

const COMMENT_MARKER = "<!-- kodeaman-security-report -->";

export class GiteaCommentManager {
  private apiUrl: string;
  private token: string;

  constructor(apiUrl?: string, token?: string) {
    this.apiUrl = apiUrl || process.env.GITEA_API_URL || "https://gitea.com/api/v1";
    this.token = token || process.env.GITEA_TOKEN || "";
  }

  async findExistingComment(
    owner: string,
    repo: string,
    issueIndex: number,
  ): Promise<number | null> {
    const url = `${this.apiUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueIndex}/comments?limit=100`;
    const res = await fetch(url, {
      headers: { Authorization: `token ${this.token}` },
    });

    if (!res.ok) return null;

    const comments = (await res.json()) as GiteaComment[];
    const existing = comments.find((comment) => comment.body.includes(COMMENT_MARKER));

    return existing?.id ?? null;
  }

  async createOrUpdateComment(
    owner: string,
    repo: string,
    issueIndex: number,
    body: string,
  ): Promise<void> {
    const markedBody = `${COMMENT_MARKER}\n${body}`;
    const existingId = await this.findExistingComment(owner, repo, issueIndex);

    if (existingId) {
      const url = `${this.apiUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/comments/${existingId}`;
      await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: markedBody }),
      });
    } else {
      const url = `${this.apiUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueIndex}/comments`;
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: markedBody }),
      });
    }
  }
}
