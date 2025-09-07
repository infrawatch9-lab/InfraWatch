/**
 * Entidades e DTOs para o sistema de agentes
 */

export interface AgentRegistrationDto {
  hostname: string;
  ip: string;
  os: string;
  arch: string;
  version?: string;
}

export interface AgentMetricsDto {
  hostname: string;
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    load1: number;
    load5: number;
    load15: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    usage_percent: number;
  };
  disk: Array<{
    device: string;
    mountpoint: string;
    total: number;
    used: number;
    free: number;
    usage_percent: number;
  }>;
  network: Array<{
    interface: string;
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  }>;
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
  };
  uptime: number;
}

export interface AgentInstallCommand {
  command: string;
  token: string;
  server_url: string;
  agent_id: string;
}

export interface RegisteredAgent {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  arch: string;
  version: string;
  token: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}
