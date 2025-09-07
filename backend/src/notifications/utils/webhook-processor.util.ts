/**
 * Classe para processamento de webhooks do CheckCle
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckCleWebhookPayload, ProcessedAlert } from '../notifications.dtos';
import { NotificationsManagerService } from '../notifications-manager.service';
import { MessageParserUtil, ParsedServiceData } from './message-parser.util';
import { EventDetectorUtil, EventType } from './event-detector.util';

export class WebhookProcessorUtil {
  constructor(private readonly notificationsService: NotificationsManagerService) {}

  /**
   * Processa o payload completo do webhook CheckCle
   */
  async processWebhookPayload(payload: CheckCleWebhookPayload): Promise<ProcessedAlert> {
    console.log('📩 Webhook recebido do CheckCle:', payload);

    // 1. Extrair informações da mensagem
    const messageData = MessageParserUtil.extractServiceData(payload.message);
    
    // 2. Validar dados extraídos
    this.validateExtractedData(messageData);
    
    // 3. Detectar tipo de evento
    const event = EventDetectorUtil.detectEventType(payload.message, messageData);
    
    // 4. Buscar informações do serviço no banco
    const serviceInfo = await this.getServiceInfo(messageData.serviceId!);
    
    // 5. Atualizar status do serviço
    await this.updateServiceStatus(messageData);
    
    // 6. Montar resposta padronizada
    return this.buildProcessedAlert(messageData, event, payload.timestamp, serviceInfo);
  }

  /**
   * Valida se os dados extraídos são suficientes
   */
  private validateExtractedData(messageData: ParsedServiceData): void {
    if (!messageData.serviceName || !messageData.serviceId) {
      throw new BadRequestException('Não foi possível extrair informações do serviço da mensagem');
    }
  }

  /**
   * Busca informações do serviço no banco de dados
   */
  private async getServiceInfo(serviceId: number): Promise<any> {
    const serviceInfo = await this.notificationsService.getServiceWithUsers(serviceId);
    
    if (!serviceInfo) {
      throw new NotFoundException(`Serviço com ID ${serviceId} não encontrado`);
    }
    
    return serviceInfo;
  }

  /**
   * Atualiza o status do serviço no banco de dados
   */
  private async updateServiceStatus(messageData: ParsedServiceData): Promise<void> {
    try {
      await this.notificationsService.updateServiceStatus(
        messageData.serviceId!,
        messageData.status || 'UNKNOWN',
        messageData.serviceType || 'UNKNOWN',
        messageData.responseTime
      );
      console.log(`✅ Status do serviço ${messageData.serviceId} atualizado para ${messageData.status}`);
    } catch (statusError) {
      console.error('⚠️ Erro ao atualizar status do serviço (continuando):', statusError);
    }
  }

  /**
   * Monta o objeto ProcessedAlert padronizado
   */
  private buildProcessedAlert(
    messageData: ParsedServiceData,
    event: EventType,
    timestamp: string,
    serviceInfo: any
  ): ProcessedAlert {
    return {
      service_name: messageData.serviceName!,
      service_type: messageData.serviceType || 'UNKNOWN',
      status: messageData.status || 'UNKNOWN',
      response_time: messageData.responseTime,
      timestamp,
      event,
      users_to_notify: serviceInfo.usersToNotify.map((userNotif: any) => ({
        name: userNotif.User.name,
        email: userNotif.User.email
      })),
      service_info: serviceInfo
    };
  }
}
