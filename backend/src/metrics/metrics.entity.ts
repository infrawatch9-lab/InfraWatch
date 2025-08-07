export type CreateMetricDto = {
  host: string;
  timestamp: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    uptime_seconds: number;
    network: {
      bytes_sent: number;
      bytes_recv: number;
    };
  };
  latency: Record<string, number>;
  logs?: string[];
  alerts?: { type: string; description: string }[];
  agent?: {
    id: string;
    name: string;
    version: string;
  };
};
