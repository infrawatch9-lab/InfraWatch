type WebhookPayload = {
  repository: {
    name: string;
  };
  head_commit: {
    message: string;
    timestamp: string;
    url: string;
  };
  pusher: {
    name: string;
  };
};

export function parseGithubWebhook(payload: WebhookPayload) {
  return {
    provider: "github",
    service: payload.repository.name,
    message: payload.head_commit.message,
    timestamp: payload.head_commit.timestamp,
    actor: payload.pusher.name,
    url: payload.head_commit.url
  };
}
