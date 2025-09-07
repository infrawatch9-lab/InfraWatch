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
    console.log('📩 Webhook recebido do CheckCle:', JSON.stringify(payload, null, 2));

    // 1. Extrair informações da mensagem
    const messageData = MessageParserUtil.extractServiceData(payload.message);
    console.log('🔍 Dados extraídos da mensagem:', JSON.stringify(messageData, null, 2));
    
    // 2. Validar dados extraídos
    this.validateExtractedData(messageData);
    
    // 3. Detectar tipo de evento
    const event = EventDetectorUtil.detectEventType(payload.message, messageData);
    console.log('📝 Evento detectado:', event);
    
    // 4. Buscar informações do serviço no banco
    console.log('🔍 Buscando informações do serviço ID:', messageData.serviceId);
    const serviceInfo = await this.getServiceInfo(messageData.serviceId!);
    console.log('📊 Serviço encontrado:', JSON.stringify({
      id: serviceInfo?.id,
      name: serviceInfo?.name,
      usersCount: serviceInfo?.usersToNotify?.length || 0
    }, null, 2));
    
    // 5. Atualizar status do serviço
    await this.updateServiceStatus(messageData);
    
    // 6. Montar resposta padronizada
    const processedAlert = this.buildProcessedAlert(messageData, event, payload.timestamp, serviceInfo);
    console.log('✅ Alert processado:', JSON.stringify({
      service_name: processedAlert.service_name,
      event: processedAlert.event,
      users_to_notify_count: processedAlert.users_to_notify.length
    }, null, 2));
    
    return processedAlert;
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
