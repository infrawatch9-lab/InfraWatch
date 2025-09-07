import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto, NotificationPaginationOptionsDto } from './dto/notifications.dto';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { SlackService } from './slack.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationsManagerService {
  private readNotificationsCache = new Set<number>();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private slackService: SlackService,
  ) {}

  // Mapear NotificationType para o formato do frontend
  private mapNotificationTypeToFrontend(type: any): 'info' | 'warning' | 'success' | 'error' {
    switch (type) {
      case 'EMAIL':
      case 'PUSH':
        return 'info';
      case 'SLACK':
      case 'TELEGRAM':
        return 'info';
      case 'SMS':
        return 'warning';
      default:
        return 'info';
    }
  }

  // Mapear tipo do frontend para NotificationType
  private mapFrontendTypeToNotification(type: 'info' | 'warning' | 'success' | 'error'): any {
    switch (type) {
      case 'info':
        return 'EMAIL';
      case 'warning':
        return 'SLACK';
      case 'success':
        return 'TELEGRAM';
      case 'error':
        return 'PUSH';
      default:
        return 'EMAIL';
    }
  }

  async getAllNotifications(
    userId: number,
    options: NotificationPaginationOptionsDto
  ) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      // Condições de busca
      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(unreadOnly ? { isRead: false } : {})
      };

      // Buscar notificações com paginação
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          include: {
            Alert: {
              include: {
                Service: {
                  select: {
                    name: true,
                    type: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          skip,
          take: limit
        }),
        this.prisma.notification.count({ where })
      ]);

      // Mapear para o formato do frontend
      const mappedNotifications = notifications.map(notification => ({
        id: notification.id,
        type: this.mapNotificationTypeToFrontend(notification.type),
        title: notification.title,
        content: notification.content,
        timestamp: notification.timestamp.toISOString(),
        read: notification.isRead
      }));

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          notifications: mappedNotifications,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            unreadCount
          }
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      throw new BadRequestException('Erro ao buscar notificações');
    }
  }

  async getUnreadCount(userId: number) {
    try {
      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false }
      });

      return {
        success: true,
        data: {
          unreadCount
        }
      };
    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas:', error);
      throw new BadRequestException('Erro ao contar notificações não lidas');
    }
  }

  async markAsRead(userId: number, notificationId: number) {
    try {
      // Verificar se a notificação existe e pertence ao usuário
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new NotFoundException('Notificação não encontrada');
      }

      if (notification.isRead) {
        return {
          success: true,
          data: {
            id: notification.id,
            isRead: true,
            readAt: notification.readAt,
            message: 'Notificação já estava marcada como lida'
          }
        };
      }

      // Marcar como lida no banco de dados
      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return {
        success: true,
        data: {
          id: updatedNotification.id,
          isRead: updatedNotification.isRead,
          readAt: updatedNotification.readAt
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw new BadRequestException('Erro ao marcar notificação como lida');
    }
  }

  async markAllAsRead(userId: number) {
    try {
      // Marcar todas as notificações não lidas como lidas
      const result = await this.prisma.notification.updateMany({
        where: { 
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return {
        success: true,
        data: {
          updatedCount: result.count
        }
      };
    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      throw new BadRequestException('Erro ao marcar todas as notificações como lidas');
    }
  }

    async sendAlert(messageEmail: string, messageSlack: string, to: string[]) {
    const subject = 'Alerta de Serviço';
    const html = '<b>' + messageEmail + '</b>';

    await this.telegramService.send(messageSlack);
    await this.emailService.send(messageEmail, subject, html, to);
    await this.slackService.send(messageSlack);
    console.log('Todos os alertas enviados:', messageSlack);
  }

  async sendNotificationToTelegram(message: string) {
    await this.telegramService.send(message);
    console.log('Alerta enviado para o Telegram:', message);
  }

  async sendNotificationToSlack(message: string) {
    await this.slackService.send(message);
    console.log('Alerta enviado para o Slack:', message);
  }

  async sendNotificationToEmail(message: string, subject: string, to: string[]) {
    const html = '<b>' + message + '</b>';
    await this.emailService.send(message, subject, html, to);
    console.log('Alerta enviado por email para:', to.join(', '));
  }

  // Ler template HTML do sistema de arquivos
  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(__dirname, 'templates', templateName);
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error(`❌ Erro ao carregar template ${templateName}:`, error);
      throw new BadRequestException(`Template ${templateName} não encontrado`);
    }
  }

  // Substituir variáveis no template HTML
  private replaceTemplateVariables(template: string, data: any): string {
    let html = template;

    // Substituições básicas
    const replacements = {
      '{{serviceName}}': data.serviceName || 'Serviço Desconhecido',
      '{{serviceUrl}}': data.serviceUrl || data.serviceName || '#',
      '{{userName}}': data.userName || 'Usuário',
      '{{status}}': data.status || 'UNKNOWN',
      '{{statusColor}}': this.getStatusColor(data.status),
      '{{statusText}}': this.getStatusText(data.status),
      '{{alertType}}': data.event || 'ALERT',
      '{{alertMessage}}': this.getAlertMessage(data.event, data.serviceType),
      '{{timestamp}}': data.timestamp || new Date().toLocaleString('pt-BR'),
      '{{responseTime}}': data.responseTime ? `${data.responseTime}ms` : 'N/A',
      '{{serviceType}}': data.serviceType || 'UNKNOWN',
      '{{checkUrl}}': data.checkUrl || data.serviceUrl || '#',
      '{{rootCause}}': data.rootCause || 'Verificando...',
      '{{incidentTime}}': data.timestamp || new Date().toLocaleString('pt-BR')
    };

    // Aplicar todas as substituições
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return html;
  }

  // Determinar cor baseada no status
  private getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'UP':
      case 'ACTIVE':
        return 'text-emerald-600';
      case 'DOWN':
      case 'FAILED':
        return 'text-red-600';
      case 'DEGRADED':
      case 'WARNING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  // Determinar texto do status
  private getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'UP':
        return 'activo(a)';
      case 'DOWN':
        return 'inativo(a)';
      case 'DEGRADED':
        return 'degradado(a)';
      default:
        return 'desconhecido(a)';
    }
  }

  // Gerar mensagem de alerta contextual
  private getAlertMessage(event: string, serviceType: string): string {
    const type = serviceType?.toUpperCase() || 'SERVIÇO';
    
    switch (event?.toUpperCase()) {
      case 'ALERT':
        if (type === 'HTTP') {
          return 'Uma interrupção foi detectada no serviço de API. O sistema de monitoramento não consegue se comunicar com a API e todas as tentativas de conexão estão falhando.';
        } else if (type === 'PING') {
          return 'O sistema de monitoramento identificou uma interrupção no serviço de PING. O serviço está atualmente indisponível e não responde às tentativas de comunicação.';
        }
        return `Uma interrupção foi detectada no serviço ${type}. O sistema está indisponível.`;
      
      case 'RESOLVED':
        if (type === 'HTTP') {
          return 'O serviço de API, anteriormente indisponível, foi restabelecido e está operando normalmente. Todas as funções foram verificadas e respondem conforme o esperado.';
        } else if (type === 'PING') {
          return 'O serviço de PING foi restabelecido e está respondendo normalmente. O monitoramento confirmou a conectividade.';
        }
        return `O serviço ${type} foi restabelecido e está operando normalmente.`;
      
      default:
        return `Alerta do sistema de monitoramento para o serviço ${type}.`;
    }
  }

  // Selecionar template baseado no serviço e status
  private selectTemplate(serviceType: string, status: string, event: string): string {
    const type = serviceType?.toLowerCase();
    const eventType = event?.toUpperCase();
    const statusType = status?.toUpperCase();

    if (type === 'http') {
      if (statusType === 'UP' || eventType === 'RESOLVED') {
        return 'http-up.html';
      } else {
        return 'http-down.html';
      }
    } else if (type === 'ping') {
      return 'ping.html';
    }

    // Default para outros tipos de serviço
    return 'ping.html';
  }

  async sendAlertWithTemplate(
    message: string, 
    subject: string, 
    to: string[], 
    templateName: string, 
    templateData: any
  ) {
    try {
      // 1. Selecionar template automaticamente se não especificado
      const finalTemplateName = templateName || this.selectTemplate(
        templateData.serviceType, 
        templateData.status, 
        templateData.event
      );

      console.log(`📧 Usando template: ${finalTemplateName} para ${templateData.serviceType}/${templateData.status}`);

      // 2. Carregar template HTML
      const templateHtml = await this.loadTemplate(finalTemplateName);

      // 3. Substituir variáveis
      const processedHtml = this.replaceTemplateVariables(templateHtml, {
        ...templateData,
        userName: 'Usuário', // Pode ser personalizado por usuário
        serviceUrl: templateData.serviceUrl || templateData.serviceName,
        checkUrl: templateData.checkUrl || templateData.serviceUrl,
        rootCause: templateData.rootCause || 'Verificando causa raiz...'
      });

      // 4. Enviar email com template processado
      await this.emailService.send(message, subject, processedHtml, to);
      
      console.log(`✅ Alerta enviado por email com template ${finalTemplateName} para:`, to.join(', '));
    } catch (error) {
      console.error('❌ Erro ao enviar com template:', error);
      
      // Fallback para template inline simples
      const fallbackHtml = this.generateFallbackTemplate(templateData);
      await this.emailService.send(message, subject, fallbackHtml, to);
      
      console.log('📧 Email enviado com template fallback');
    }
  }

  // Template fallback caso os arquivos não estejam disponíveis
  private generateFallbackTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #020E36; color: white; padding: 20px; text-align: center;">
          <h1>InfraWatch</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Detalhes do Alerta</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Serviço:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.serviceName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tipo:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.serviceType}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><span style="color: ${data.status === 'UP' ? 'green' : 'red'};">${data.status}</span></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Evento:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.event}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.timestamp}</td></tr>
            ${data.responseTime ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tempo de Resposta:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.responseTime}ms</td></tr>` : ''}
          </table>
        </div>
        <div style="background-color: #020E36; color: white; padding: 10px; text-align: center; font-size: 12px;">
          InfraWatch Monitoring System
        </div>
      </div>
    `;
  }

  async getServiceWithUsers(serviceId: number) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          usersToNotify: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          Team: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return service;
    } catch (error) {
      console.error('❌ Erro ao buscar serviço com usuários:', error);
      throw new BadRequestException('Erro ao buscar informações do serviço');
    }
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: createNotificationDto.userId,
          alertId: createNotificationDto.alertId,
          title: createNotificationDto.title,
          content: createNotificationDto.content,
          message: createNotificationDto.message || createNotificationDto.content,
          type: this.mapFrontendTypeToNotification(createNotificationDto.type),
          channel: createNotificationDto.channel,
          isRead: false
        }
      });

      return {
        success: true,
        data: {
          id: notification.id,
          type: createNotificationDto.type,
          title: notification.title,
          content: notification.content,
          timestamp: notification.timestamp.toISOString(),
          read: notification.isRead
        }
      };
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      throw new BadRequestException('Erro ao criar notificação');
    }
  }

  async deleteOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Buscar notificações antigas que estão marcadas como lidas
      const oldNotifications = await this.prisma.notification.findMany({
        where: {
          timestamp: {
            lt: cutoffDate
          },
          isRead: true
        },
        select: { id: true }
      });

      // Filtrar apenas as que estão marcadas como lidas no cache
      const readOldNotifications = oldNotifications.filter(n => 
        this.readNotificationsCache.has(n.id)
      );

      if (readOldNotifications.length > 0) {
        const idsToDelete = readOldNotifications.map(n => n.id);
        
        const result = await this.prisma.notification.deleteMany({
          where: {
            id: {
              in: idsToDelete
            }
          }
        });

        // Remover do cache também
        idsToDelete.forEach(id => this.readNotificationsCache.delete(id));

        console.log(`🧹 Removidas ${result.count} notificações antigas (mais de ${daysOld} dias)`);
        
        return {
          success: true,
          data: {
            deletedCount: result.count
          }
        };
      }

      return {
        success: true,
        data: {
          deletedCount: 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao remover notificações antigas:', error);
      throw new BadRequestException('Erro ao remover notificações antigas');
    }
  }

  // Novo método para salvar notificações de webhook do CheckCle
  async saveWebhookNotification(
    users: Array<{ email: string; name: string; id?: number }>,
    alertData: {
      service_name: string;
      service_type: string;
      status: string;
      event: string;
      timestamp: string;
      response_time?: number;
    }
  ) {
    try {
      // Determinar o tipo de notificação baseado no evento
      let notificationType: 'info' | 'warning' | 'success' | 'error' = 'info';
      
      switch (alertData.event.toUpperCase()) {
        case 'ALERT':
        case 'INCIDENT':
          notificationType = 'error';
          break;
        case 'WARNING':
          notificationType = 'warning';
          break;
        case 'RESOLVED':
          notificationType = 'success';
          break;
        default:
          notificationType = 'info';
      }

      // Montar título e conteúdo
      const title = `${alertData.event}: ${alertData.service_name}`;
      
      let content = `Serviço: ${alertData.service_name}\n`;
      content += `Tipo: ${alertData.service_type}\n`;
      content += `Status: ${alertData.status}\n`;
      content += `Evento: ${alertData.event}\n`;
      content += `Timestamp: ${new Date(alertData.timestamp).toLocaleString('pt-BR')}`;
      
      if (alertData.response_time) {
        content += `\nTempo de Resposta: ${alertData.response_time}ms`;
      }

      // Buscar IDs dos usuários se não fornecidos
      const userIds = await Promise.all(
        users.map(async (user) => {
          if (user.id) return user.id;
          
          const dbUser = await this.prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
          });
          
          return dbUser?.id;
        })
      );

      // Filtrar usuários válidos
      const validUserIds = userIds.filter(id => id !== undefined) as number[];

      if (validUserIds.length === 0) {
        console.log('⚠️ Nenhum usuário válido encontrado para salvar notificações');
        return [];
      }

      // Criar notificações em batch
      const notifications = await Promise.all(
        validUserIds.map(userId =>
          this.prisma.notification.create({
            data: {
              userId,
              title,
              content,
              message: content, // Para compatibilidade
              type: this.mapFrontendTypeToNotification(notificationType),
              channel: 'EMAIL',
              isRead: false
            }
          })
        )
      );

      console.log(`✅ ${notifications.length} notificações salvas na base de dados`);
      
      return notifications.map(notification => ({
        id: notification.id,
        type: notificationType,
        title: notification.title,
        content: notification.content,
        timestamp: notification.timestamp.toISOString(),
        read: notification.isRead
      }));

    } catch (error) {
      console.error('❌ Erro ao salvar notificações do webhook:', error);
      throw new BadRequestException('Erro ao salvar notificações do webhook');
    }
  }

  // Atualizar status do serviço na base de dados local
  async updateServiceStatus(
    serviceId: number, 
    status: string, 
    serviceType: string,
    responseTime?: number
  ) {
    try {
      // Mapear status para ServiceStatus enum
      let mappedStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING' | 'PAUSED' | 'ACTIVE' | 'INACTIVE';
      
      switch (status.toUpperCase()) {
        case 'UP':
        case 'ACTIVE':
        case 'OK':
          mappedStatus = 'UP';
          break;
        case 'DOWN':
        case 'FAILED':
        case 'ERROR':
          mappedStatus = 'DOWN';
          break;
        case 'DEGRADED':
        case 'WARNING':
        case 'WARN':
          mappedStatus = 'DEGRADED';
          break;
        case 'PENDING':
          mappedStatus = 'PENDING';
          break;
        case 'PAUSED':
          mappedStatus = 'PAUSED';
          break;
        case 'INACTIVE':
          mappedStatus = 'INACTIVE';
          break;
        default:
          mappedStatus = 'DOWN';
      }

      // 1. Atualizar o status do serviço
      const updatedService = await this.prisma.service.update({
        where: { id: serviceId },
        data: {
          status: mappedStatus
        },
        include: {
          configs: {
            include: {
              HttpConfig: true,
              PingConfig: true
            }
          }
        }
      });

      // 2. Atualizar campos específicos nos configs se responseTime fornecido
      if (responseTime !== undefined && updatedService.configs) {
        const type = serviceType.toUpperCase();
        
        try {
          if (type === 'HTTP' && updatedService.configs.HttpConfig) {
            // Atualizar expectedResponseTimeMs no HttpConfig
            await this.prisma.httpConfig.update({
              where: { 
                monitoringId: updatedService.configs.id 
              },
              data: {
                responseTime: Math.round(responseTime),
                updatedAt: new Date()
              }
            });
            console.log(`✅ HttpConfig atualizado com responseTime: ${responseTime}ms`);
          } else if (type === 'PING' && updatedService.configs.PingConfig) {
            await this.prisma.pingConfig.update({
              where: { 
                monitoringId: updatedService.configs.id 
              },
              data: {
                responseTime: Math.round(responseTime),
              }
            });
            console.log(`✅ PINGConfig atualizado com responseTime: ${responseTime}ms`);
          }
        } catch (configError) {
          console.error('⚠️ Erro ao atualizar config específico (continuando):', configError);
        }
      }

      console.log(`✅ Status do serviço ${serviceId} atualizado:`, {
        id: updatedService.id,
        name: updatedService.name,
        status: updatedService.status,
        type: serviceType,
        responseTime: responseTime
      });

      return {
        success: true,
        data: {
          id: updatedService.id,
          name: updatedService.name,
          status: updatedService.status,
          type: serviceType,
          responseTime: responseTime
        }
      };

    } catch (error) {
      console.error(`❌ Erro ao atualizar status do serviço ${serviceId}:`, error);
      
      if ((error as any)?.code === 'P2025') {
        throw new NotFoundException(`Serviço com ID ${serviceId} não encontrado`);
      }
      
      throw new BadRequestException(`Erro ao atualizar status do serviço: ${(error as Error).message}`);
    }
  }
}
