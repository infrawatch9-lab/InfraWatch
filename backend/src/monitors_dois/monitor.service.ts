import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ServiceType, ServiceStatus, Service } from '@prisma/client';
import { PingHandler } from './ping/pingMonitor.service';
import { HttpHandler } from './http/httpMonitor.service';
import { SnmpHandler } from './snmp/snmpMonitor.service';
import { WebhookHandler } from './webhook/webhookMonitor.service';
import { startMonitor, stopMonitor, restartMonitor } from './monitor.utils';

type ServiceWithConfig = Service & { configs?: any[] };

@Injectable()
export class MonitorsService implements OnModuleInit {
  private readonly logger = new Logger(MonitorsService.name);

  private handlers!: Record<ServiceType, { start: (service: ServiceWithConfig) => Promise<void> }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pingHandler: PingHandler,
    private readonly httpHandler: HttpHandler,
    private readonly snmpHandler: SnmpHandler,
    private readonly webhookHandler: WebhookHandler,
  ) {}

  async onModuleInit() {
    this.handlers = {
      [ServiceType.PING]: this.pingHandler,
      [ServiceType.HTTP]: this.httpHandler,
      [ServiceType.SNMP]: this.snmpHandler,
      [ServiceType.WEBHOOK]: this.webhookHandler,
      [ServiceType.SERVER]: this.pingHandler,
      [ServiceType.API]: this.httpHandler,
      [ServiceType.DATABASE]: this.pingHandler,
      [ServiceType.CUSTOM]: this.pingHandler,
      [ServiceType.NETWORK]: this.snmpHandler,
      [ServiceType.WEBSITE]: this.httpHandler,
    };

    await this.initializeMonitors();
  }

  private async initializeMonitors() {
      const services = await this.prisma.service.findMany({
        where: { status: { not: ServiceStatus.PAUSED } },
        include: { 
          configs: {
            include: {
              PingConfig: true,
              SnmpConfig: true,
            }
          }
        },
      });

      this.logger.log(`🔍 Found ${services.length} services to monitor`);

      for (const service of services) {
        this.logger.log(`📋 Processing service: ${service.name} (${service.type})`);
        this.logger.log(`⚙️ Service configs: ${JSON.stringify(service.configs, null, 2)}`);
        
        const handler = this.handlers[service.type];
        if (handler) {
          startMonitor(service, handler);
        } else {
          this.logger.warn(`⚠️ No handler found for service type: ${service.type}`);
        }
      }
    }

    public restartMonitorById(serviceId: number) {
      return this.prisma.service.findUnique({
        where: { id: serviceId },
        include: { 
          configs: {
            include: {
              PingConfig: true,
              SnmpConfig: true,
            }
          }
        },
      }).then(service => {
        if (service) {
          this.logger.log(`🔄 Restarting monitor for service: ${service.name}`);
          const handler = this.handlers[service.type];
          if (handler) restartMonitor(service, handler);
        }
      });
    }
}
