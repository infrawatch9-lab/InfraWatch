import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsManagerService } from '../notifications/notifications-manager.service';
import { EmailService } from '../notifications/email.service';

export interface ServiceAlert {
  serviceId: number;
  status: string;
  message?: string;
  timestamp: string;
  recipients?: string[];
}

@Injectable()
export class AlertProcessorService {
  constructor(
    private prisma: PrismaService,
    private notificationsManager: NotificationsManagerService,
    private emailService: EmailService
  ) {}

  /**
   * Processa alertas de serviços
   */
  async processServiceAlert(alert: ServiceAlert): Promise<void> {
    try {
      console.log(`🚨 Processando alerta para serviceId: ${alert.serviceId}, status: ${alert.status}`);

      // Atualizar status no banco de dados
      await this.updateServiceStatus(alert.serviceId, alert.status);

      // Criar notificações se necessário
      if (this.shouldCreateNotification(alert.status)) {
        const alertId = await this.createNotifications(alert);
        
        // Enviar email
        await this.sendEmailAlert(alert, alertId);
      }

      console.log(`✅ Alerta processado com sucesso para serviceId: ${alert.serviceId}`);
    } catch (error) {
      console.error(`❌ Erro ao processar alerta para serviceId: ${alert.serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status do serviço no banco de dados
   */
  private async updateServiceStatus(serviceId: number, status: string): Promise<void> {
    try {
      console.log(`🔄 Atualizando status do serviço ${serviceId} para ${status}`);
      
      // Mapear string para enum ServiceStatus
      const serviceStatusMap: Record<string, any> = {
        'UP': 'UP',
        'DOWN': 'DOWN',
        'DEGRADED': 'DEGRADED',
        'PENDING': 'PENDING',
        'ACTIVE': 'ACTIVE',
        'INACTIVE': 'INACTIVE'
      };

      const mappedStatus = serviceStatusMap[status.toUpperCase()] || 'PENDING';
      
      const updatedService = await this.prisma.service.update({
        where: { id: serviceId },
        data: { status: mappedStatus },
      });
      
      console.log(`✅ Status atualizado: Serviço ${serviceId} agora está ${status}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar status do serviço ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se deve criar notificação baseado no status
   */
  private shouldCreateNotification(status: string): boolean {
    const alertStatuses = ['DOWN', 'ERROR', 'DEGRADED', 'CRITICAL'];
    return alertStatuses.includes(status.toUpperCase());
  }

  /**
   * Cria notificações para usuários relevantes
   */
  private async createNotifications(alert: ServiceAlert): Promise<number> {
    const alertId = this.generateAlertId();
    
    console.log(`🔔 Criando notificações para serviceId: ${alert.serviceId}`);

    try {
      // Buscar usuários que devem ser notificados sobre este serviço
      const serviceUserNotifications = await this.prisma.serviceUserNotification.findMany({
        where: {
          serviceId: alert.serviceId
        },
        include: {
          User: true,
          Service: true
        }
      });

      // Criar notificação para cada usuário específico
      for (const serviceUser of serviceUserNotifications) {
        await this.createUserNotification(serviceUser, alert, alertId);
      }

      // Se não há usuários específicos, notificar administradores
      if (serviceUserNotifications.length === 0) {
        await this.createAdminNotifications(alert, alertId);
      }

      return alertId;
    } catch (error) {
      console.error('❌ Erro ao criar notificações:', error);
      throw error;
    }
  }

  /**
   * Cria notificação para um usuário específico
   */
  private async createUserNotification(serviceUser: any, alert: ServiceAlert, alertId: number): Promise<void> {
    const message = this.buildNotificationMessage(serviceUser.Service.name, alert);
    
    try {
      await this.notificationsManager.createNotification({
        userId: serviceUser.userId,
        alertId: alertId,
        message: message,
        type: 'EMAIL',
        channel: 'EMAIL'
      });

      console.log(`✅ Notificação criada para usuário ${serviceUser.User.email} sobre serviço ${serviceUser.Service.name}`);
    } catch (error) {
      console.error(`❌ Erro ao criar notificação para usuário ${serviceUser.User.email}:`, error);
    }
  }

  /**
   * Cria notificações para administradores
   */
  private async createAdminNotifications(alert: ServiceAlert, alertId: number): Promise<void> {
    console.log(`📢 Nenhum usuário específico configurado, criando notificação para administradores`);
    
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      for (const admin of adminUsers) {
        const message = `[ADMIN] Serviço ID ${alert.serviceId} está ${this.getStatusDescription(alert.status)}. ${alert.message || ''}`;
        
        try {
          await this.notificationsManager.createNotification({
            userId: admin.id,
            alertId: alertId,
            message: message,
            type: 'EMAIL',
            channel: 'EMAIL'
          });

          console.log(`✅ Notificação de admin criada para ${admin.email}`);
        } catch (error) {
          console.error(`❌ Erro ao criar notificação de admin para ${admin.email}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar administradores:', error);
    }
  }

  /**
   * Envia alerta por email
   */
  private async sendEmailAlert(alert: ServiceAlert, alertId: number): Promise<void> {
    try {
      console.log(`📧 Enviando alerta de email para serviceId: ${alert.serviceId}`);
      
      await this.emailService.sendAlert('ping', { 
        payload: alert, 
        timestamp: alert.timestamp 
      }, alertId);
      
      console.log(`✅ Email enviado com sucesso para serviceId: ${alert.serviceId}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar email para serviceId: ${alert.serviceId}:`, error);
    }
  }

  /**
   * Constrói mensagem de notificação
   */
  private buildNotificationMessage(serviceName: string, alert: ServiceAlert): string {
    const statusDescription = this.getStatusDescription(alert.status);
    const additionalMessage = alert.message ? ` ${alert.message}` : '';
    return `Serviço "${serviceName}" está ${statusDescription}.${additionalMessage}`;
  }

  /**
   * Obtém descrição amigável do status
   */
  private getStatusDescription(status: string): string {
    const statusMap: Record<string, string> = {
      'DOWN': 'fora do ar',
      'ERROR': 'com erro',
      'DEGRADED': 'com performance degradada',
      'CRITICAL': 'em estado crítico',
      'UP': 'funcionando normalmente'
    };

    return statusMap[status.toUpperCase()] || status.toLowerCase();
  }

  /**
   * Gera ID único para alertas
   */
  private generateAlertId(): number {
    return 1337 + Math.floor(Date.now() / 1000);
  }

  /**
   * Obtém estatísticas de processamento de alertas
   */
  async getAlertStats() {
    try {
      const [totalAlerts, recentAlerts, activeServices] = await Promise.all([
        this.prisma.alert.count(),
        this.prisma.alert.count({
          where: {
            triggeredAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
            }
          }
        }),
        this.prisma.service.count({
          where: {
            status: 'ACTIVE'
          }
        })
      ]);

      return {
        totalAlerts,
        recentAlerts,
        activeServices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de alertas:', error);
      return {
        totalAlerts: 0,
        recentAlerts: 0,
        activeServices: 0,
        error: 'Erro ao obter estatísticas',
        timestamp: new Date().toISOString()
      };
    }
  }
}
