import {
  IsString,
  IsNumber,
  IsObject,
  IsArray,
  IsOptional,
} from 'class-validator';


export class Metric {
  id: string;
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  bytesSent: bigint;
  bytesRecv: bigint;
  latency: Record<string, number>;
  logs?: string[];
  alerts?: { type: string; description: string }[];
  agentId: string;
  createdAt: Date;
}

export class CreateMetricDto {
  @IsString()
  host: string;

  @IsString()
  timestamp: string;

  @IsObject()
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

  @IsObject()
  latency: Record<string, number>;

  @IsOptional()
  @IsArray()
  logs?: string[];

  @IsOptional()
  @IsArray()
  alerts?: {
    type: string;
    description: string;
  }[];
}
