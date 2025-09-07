/**
 * Classe para envio de notificações de alerta
 */

import { ProcessedAlert } from '../notifications.dtos';
import { NotificationsManagerService } from '../notifications-manager.service';

export class AlertNotificationSender {
  constructor(private readonly notificationsService: NotificationsManagerService) {}

  /**
   * Envia notificações de alerta para usuários
   */
  async sendAlertNotifications(alertData: ProcessedAlert): Promise<void> {
    if (alertData.users_to_notify.length === 0) {
      console.log('⚠️ Nenhum usuário para notificar');
      return;
    }
    
    // 1. Salvar notificações na base de dados
    await this.saveNotificationsToDB(alertData);
    
    // 2. Enviar notificações por email
    await this.sendEmailNotifications(alertData);
  }

  /**
   * Salva notificações na base de dados
   */
  private async saveNotificationsToDB(alertData: ProcessedAlert): Promise<void> {
    try {
      await this.notificationsService.saveWebhookNotification(
        alertData.users_to_notify,
        {
          service_name: alertData.service_name,
          service_type: alertData.service_type,
          status: alertData.status,
          event: alertData.event,
          timestamp: alertData.timestamp,
          response_time: alertData.response_time
        }
      );
      console.log(`💾 Notificações salvas na base de dados para ${alertData.users_to_notify.length} usuários`);
    } catch (error) {
      console.error('❌ Erro ao salvar notificações na base de dados:', error);
    }
  }

  /**
   * Envia notificações por email
   */
  private async sendEmailNotifications(alertData: ProcessedAlert): Promise<void> {
    const subject = `${alertData.event}: ${alertData.service_name}`;
    const emailMessage = this.buildEmailMessage(alertData);
    const emailAddresses = alertData.users_to_notify.map(user => user.email);
    const templateVariables = this.buildTemplateVariables(alertData);

    try {
      // Enviar usando templates dinâmicos (seleção automática)
      await this.notificationsService.sendAlertWithTemplate(
        emailMessage,
        subject,
        emailAddresses,
        '', // Template será selecionado automaticamente
        templateVariables
      );
      
      console.log(`📧 Notificação enviada para ${emailAddresses.length} usuários com template dinâmico:`, emailAddresses);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      // Fallback para envio simples
      await this.sendFallbackEmail(emailMessage, subject, emailAddresses);
    }
  }

  /**
   * Monta a mensagem de email
   */
  private buildEmailMessage(alertData: ProcessedAlert): string {
    let emailMessage = `
      Serviço: ${alertData.service_name}
      Tipo: ${alertData.service_type}
      Status: ${alertData.status}
      Evento: ${alertData.event}
      Timestamp: ${new Date(alertData.timestamp).toLocaleString('pt-BR')}
    `;
    
    if (alertData.response_time) {
      emailMessage += `\nTempo de Resposta: ${alertData.response_time}ms`;
    }
    
    return emailMessage.trim();
  }

  /**
   * Monta as variáveis para os templates
   */
  private buildTemplateVariables(alertData: ProcessedAlert): Record<string, any> {
    return {
      serviceName: alertData.service_name,
      serviceType: alertData.service_type,
      serviceUrl: alertData.service_name, // Pode ser melhorado com URL real
      checkUrl: alertData.service_name,
      status: alertData.status,
      event: alertData.event,
      timestamp: new Date(alertData.timestamp).toLocaleString('pt-BR'),
      responseTime: alertData.response_time,
      rootCause: 'Investigando causa raiz...',
      userName: 'Usuário' // Será personalizado por usuário se necessário
    };
  }

  /**
   * Envio de fallback em caso de erro no template
   */
  private async sendFallbackEmail(message: string, subject: string, emailAddresses: string[]): Promise<void> {
    await this.notificationsService.sendNotificationToEmail(
      message,
      subject,
      emailAddresses
    );
    console.log(`📧 Notificação enviada (fallback) para ${emailAddresses.length} usuários:`, emailAddresses);
  }
}
