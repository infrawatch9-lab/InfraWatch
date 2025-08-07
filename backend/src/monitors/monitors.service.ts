import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { PingService } from './ping.service';
import { SnmpService } from './snmp.service';
import { WebhookService } from './webhook.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MonitorResult, MonitorConfig } from './interfaces/monitor.interface';
import { ServiceType, ServiceStatus, AlertLevel } from '@prisma/client';

@Injectable()
export class MonitorsService implements OnModuleInit {
  private readonly logger = new Logger(MonitorsService.name);
  private activeMonitors = new Map<number, NodeJS.Timeout>();
  private alertStates = new Map<string, {lastAlertTime: Date, isAlerting: boolean }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pingService: PingService,
    private readonly snmpService: SnmpService,
    private readonly webhookService: WebhookService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.initializeMonitors();
  }

  /**
   * Inicializa todos os monitores ativos
   */
  private async initializeMonitors(): Promise<void> {
    try {
      const services = await this.prisma.service.findMany({
        include: {
          configs: true,
          rules: true,
        },
        where: {
          status: {
            not: ServiceStatus.PENDING,
          },
        },
      });

      this.logger.log(`Inicializando -${services.length}- monitores...`);

      for (const service of services) {
        await this.startMonitoring(service);
      }

      this.logger.log('Todos os monitores foram inicializados');
    } catch (error) {
      this.logger.error('Erro ao inicializar monitores:', error);
    }
  }

  /**
   * Inicia o monitoramento de um serviço específico
   */
  async startMonitoring(service: any): Promise<void> {
    const config = service.configs[0];
    if (!config) {
      this.logger.warn(
        `Serviço ${service.name} não possui configuração de monitoramento`,
      );
      return;
    }

    // Para monitoramento existente
    this.stopMonitoring(service.id);

    // Cria novo intervalo de monitoramento
    const interval = setInterval(async () => {
      await this.executeMonitoring(service);
    }, config.frequency * 1000);

    this.activeMonitors.set(service.id, interval);
    this.logger.log(`Monitor iniciado para ${service.name} (${service.type})`);
  }

  /**
   * Para o monitoramento de um serviço
   */
  stopMonitoring(serviceId: number): void {
    const interval = this.activeMonitors.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.activeMonitors.delete(serviceId);
      this.logger.log(`Monitor parado para serviço ID: ${serviceId}`);
    }
  }

  /**
   * Executa o monitoramento baseado no tipo de serviço
   */
  private async executeMonitoring(service: any): Promise<void> {
    try {
      const config = service.configs[0];
      let result: MonitorResult;

      switch (service.type) {
        case ServiceType.SERVER:
        case ServiceType.NETWORK:
          result = await this.pingService.monitor(service, config);
          break;

        case ServiceType.WEBSITE:
        case ServiceType.API:
          result = await this.webhookService.monitor(service, config);
          break;

        case ServiceType.DATABASE:
          result = await this.snmpService.monitor(service, config);
          break;

        default:
          result = await this.pingService.monitor(service, config);
      }

      // Salva métricas no banco
      await this.saveMetrics(result);

      // Verifica regras de alerta
      await this.checkAlertRules(service, result);

      // Atualiza status do serviço
      await this.updateServiceStatus(service.id, result.status);
    } catch (error) {
      this.logger.error(
        `Erro no monitoramento do serviço ${service.name}:`,
        error,
      );

      // Registra erro como métrica
      await this.saveMetrics({
        serviceId: service.id,
        status: ServiceStatus.DOWN,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Salva métricas no banco de dados (TimescaleDB)
   */
  private async saveMetrics(result: MonitorResult): Promise<void> {
    try {
      await this.prisma.metric.create({
        data: {
          serviceId: result.serviceId,
          timestamp: result.timestamp,
          status: result.status,
          latency: result.latency,
          cpu: result.metrics?.cpu,
          memory: result.metrics?.memory,
          errorMsg: result.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao salvar métricas:', error);
    }
  }

 /**
 * Verifica regras de alerta e dispara notificações (verificando banco)
 */
private async checkAlertRules(
  service: any,
  result: MonitorResult,
): Promise<void> {
  try {
    for (const rule of service.rules) {
      if (!rule.active) continue;

      const shouldAlert = this.evaluateAlertRule(rule, result);

      if (shouldAlert) {
        // Verifica se já existe alerta não resolvido
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            serviceId: service.id,
            ruleId: rule.id,
            resolved: false,
          },
          orderBy: {
            triggeredAt: 'desc',
          },
        });

        if (!existingAlert) {
          // Cria novo alerta apenas se não existe um ativo
          const alert = await this.prisma.alert.create({
            data: {
              serviceId: service.id,
              ruleId: rule.id,
              message: `${service.name}: ${rule.field} ${rule.condition} - Status: ${result.status}`,
            },
          });

          // Envia notificação
          await this.notificationsService.sendAlert(alert.message);

          this.logger.warn(
            `🚨 NOVO ALERTA para ${service.name}: ${alert.message}`,
          );
        } else {
          // Verifica se deve reenviar baseado no tempo
          const timeSinceAlert = new Date().getTime() - existingAlert.triggeredAt.getTime();
          const renotifyInterval = 30 * 60 * 1000; // 30 minutos

          if (timeSinceAlert > renotifyInterval) {
            await this.notificationsService.sendAlert(
              `🔄 LEMBRETE: ${service.name} ainda com problema há ${Math.round(timeSinceAlert / 60000)} minutos`
            );

            this.logger.warn(`🔄 Reenvio de alerta para ${service.name}`);
          }
        }
      } else {
        // Resolve alertas ativos se a condição não está mais sendo atendida
        await this.prisma.alert.updateMany({
          where: {
            serviceId: service.id,
            ruleId: rule.id,
            resolved: false,
          },
          data: {
            resolved: true,
          },
        });

        // Envia notificação de recuperação se havia alerta ativo
        const hadActiveAlert = await this.prisma.alert.findFirst({
          where: {
            serviceId: service.id,
            ruleId: rule.id,
            resolved: true,
          },
          orderBy: {
            triggeredAt: 'desc',
          },
        });

        if (hadActiveAlert && new Date().getTime() - hadActiveAlert.triggeredAt.getTime() < 60000) {
          await this.notificationsService.sendAlert(
            `✅ RECUPERADO: ${service.name} - ${rule.field} voltou ao normal`
          );

          this.logger.log(`✅ Serviço ${service.name} recuperado`);
        }
      }
    }
  } catch (error) {
    this.logger.error('Erro ao verificar regras de alerta:', error);
  }
}

  /**
   * Avalia se uma regra de alerta deve ser disparada
   */
  private evaluateAlertRule(rule: any, result: MonitorResult): boolean {
    const field = rule.field.toLowerCase();
    const condition = rule.condition;

    switch (field) {
      case 'status':
        return (
          result.status === ServiceStatus.DOWN && condition.includes('DOWN')
        );

      case 'latency':
        if (result.latency) {
          const threshold = parseFloat(condition.match(/\d+/)?.[0] || '0');
          return condition.includes('>')
            ? result.latency > threshold
            : result.latency < threshold;
        }
        break;

      case 'cpu':
        if (result.metrics?.cpu) {
          const threshold = parseFloat(condition.match(/\d+/)?.[0] || '0');
          return condition.includes('>')
            ? result.metrics.cpu > threshold
            : result.metrics.cpu < threshold;
        }
        break;

      case 'memory':
        if (result.metrics?.memory) {
          const threshold = parseFloat(condition.match(/\d+/)?.[0] || '0');
          return condition.includes('>')
            ? result.metrics.memory > threshold
            : result.metrics.memory < threshold;
        }
        break;
    }

    return false;
  }

  /**
   * Atualiza o status do serviço
   */
  private async updateServiceStatus(
    serviceId: number,
    status: ServiceStatus,
  ): Promise<void> {
    try {
      await this.prisma.service.update({
        where: { id: serviceId },
        data: { status },
      });
    } catch (error) {
      this.logger.error('Erro ao atualizar status do serviço:', error);
    }
  }

  /**
   * Cron job para limpeza de métricas antigas (executa diariamente às 2h)
   */
  @Cron('0 2 * * *')
  async cleanupOldMetrics(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await this.prisma.metric.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(
        `Limpeza concluída: ${deleted.count} métricas antigas removidas`,
      );
    } catch (error) {
      this.logger.error('Erro na limpeza de métricas:', error);
    }
  }

  /**
   * Adiciona um novo serviço para monitoramento
   */
  async addService(serviceId: number): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: true,
        rules: true,
      },
    });

    if (service) {
      await this.startMonitoring(service);
    }
  }

  /**
   * Remove um serviço do monitoramento
   */
  async removeService(serviceId: number): Promise<void> {
    this.stopMonitoring(serviceId);
  }

  /**
   * Obtém estatísticas dos monitores ativos
   */
  getMonitoringStats(): {
    activeMonitors: number;
    monitoredServices: number[];
  } {
    return {
      activeMonitors: this.activeMonitors.size,
      monitoredServices: Array.from(this.activeMonitors.keys()),
    };
  }
}
