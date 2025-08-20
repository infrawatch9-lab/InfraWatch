import { BaseServiceDto } from "../service.common-entity";
import { ServiceType } from "@prisma/client";

export interface CreatePingServiceDto extends BaseServiceDto {
  type: 'PING';
  pingConfig: {
    interval?: number;
    timeout?: number;
    webhookUrl?: string;
    ipAddress: string;
    packetSize?: number;
    ttl?: number;
  };
}