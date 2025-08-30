type WebhookPayload = {
  repository: {
    name: string;
  };
  head_commit: {
    message: string;
    timestamp: string;
  };
};

export function parseGithubWebhook(payload: WebhookPayload) {
  return {
    provider: "github",
    service: payload.repository.name,
    message: payload.head_commit.message,
    timestamp: payload.head_commit.timestamp,
  };
}
