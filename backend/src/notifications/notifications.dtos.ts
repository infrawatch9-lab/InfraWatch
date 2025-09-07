export interface AuthenticatedRequest {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

export interface CheckCleWebhookPayload {
  message: string;
  notify_name: string;
  timestamp: string;
}

export interface ProcessedAlert {
  service_name: string;
  service_type: string;
  status: string;
  response_time?: number;
  timestamp: string;
  event: string;
  users_to_notify: Array<{ name: string; email: string }>;
  service_info: any;
}