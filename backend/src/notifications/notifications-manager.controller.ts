import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsManagerService } from './notifications-manager.service';
import { CreateNotificationDto, NotificationResponseDto } from './dto/notifications.dto';
import { Public } from '../auth/public.decorator';
import { AuthenticatedRequest, CheckCleWebhookPayload, ProcessedAlert } from './notifications.dtos';

@ApiTags('Notifications Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsManagerController {
  constructor(private readonly notificationsService: NotificationsManagerService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Buscar todas as notificações do usuário',
    description: 'Retorna todas as notificações do usuário logado com status de leitura (true = lida, false = não lida)'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade por página (padrão: 20)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Buscar apenas não lidas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  type: { type: 'string', enum: ['info', 'warning', 'success', 'error'], example: 'error' },
                  title: { type: 'string', example: 'ALERT: Google HTTP Service' },
                  content: { type: 'string', example: 'Serviço: Google HTTP Service\nTipo: HTTP\nStatus: DOWN\nEvento: ALERT\nTimestamp: 06/09/2025 14:30:00' },
                  timestamp: { type: 'string', format: 'date-time', example: '2025-09-06T14:30:00Z' },
                  read: { type: 'boolean', example: false }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                totalPages: { type: 'number', example: 3 },
                unreadCount: { type: 'number', example: 12 }
              }
            }
          }
        }
      }
    }
  })
  async getAllNotifications(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('unreadOnly') unreadOnly: string = 'false'
  ) {
    const userId = req.user.sub;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const unreadOnlyBool = unreadOnly === 'true';

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Parâmetros de paginação inválidos');
    }

    return this.notificationsService.getAllNotifications(userId, {
      page: pageNum,
      limit: limitNum,
      unreadOnly: unreadOnlyBool
    });
  }

  @Get('unread-count')
  @ApiOperation({ 
    summary: 'Contar notificações não lidas',
    description: 'Retorna o número total de notificações não lidas do usuário'
  })
  @ApiResponse({
    status: 200,
    description: 'Contagem de notificações não lidas',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            unreadCount: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post(':id/mark-read')
  @ApiOperation({ 
    summary: 'Marcar notificação como lida',
    description: 'Marca uma notificação específica como lida'
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            isRead: { type: 'boolean', example: true },
            readAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async markAsRead(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      throw new BadRequestException('ID da notificação inválido');
    }

    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Post('mark-all-read')
  @ApiOperation({ 
    summary: 'Marcar todas as notificações como lidas',
    description: 'Marca todas as notificações do usuário como lidas'
  })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações marcadas como lidas',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            updatedCount: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('checkcle-webhook')
  @Public()
  @ApiOperation({ 
    summary: 'Webhook do CheckCle',
    description: 'Recebe alertas do CheckCle e processa notificações para usuários'
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            processed: { type: 'boolean', example: true },
            serviceId: { type: 'number', example: 19 },
            event: { type: 'string', example: 'ALERT' },
            notified_users: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  async processCheckcleWebhook(@Body() payload: CheckCleWebhookPayload) {
    try {
      // 1. Processar o payload do CheckCle
      const processedAlert = await this.processCheckclePayload(payload);
      
      // 2. Enviar notificações por email
      await this.sendAlertNotifications(processedAlert);
      
      return {
        success: true,
        data: {
          processed: true,
          serviceId: processedAlert.service_info?.id || null,
          event: processedAlert.event,
          notified_users: processedAlert.users_to_notify.length
        }
      };
    } catch (error) {
      console.error('❌ Erro ao processar webhook do CheckCle:', error);
      throw new BadRequestException(`Erro ao processar webhook: ${(error as Error).message || 'Erro desconhecido'}`);
    }
  }

  private async processCheckclePayload(payload: CheckCleWebhookPayload): Promise<ProcessedAlert> {
    console.log('📩 Webhook recebido do CheckCle:', payload);

    // 1. Detectar o tipo de evento baseado na mensagem
    const event = this.detectEventType(payload.message);
    
    // 2. Extrair informações da mensagem (incluindo nome do serviço e ID)
    const messageData = this.extractServiceDataFromMessage(payload.message);
    
    if (!messageData.serviceName || !messageData.serviceId) {
      throw new BadRequestException('Não foi possível extrair informações do serviço da mensagem');
    }
    
    // 3. Buscar informações do serviço no banco
    const serviceInfo = await this.notificationsService.getServiceWithUsers(messageData.serviceId);
    
    if (!serviceInfo) {
      throw new NotFoundException(`Serviço com ID ${messageData.serviceId} não encontrado`);
    }
    
    // 4. Atualizar status do serviço na base de dados local
    try {
      await this.notificationsService.updateServiceStatus(
        messageData.serviceId,
        messageData.status || 'UNKNOWN',
        messageData.serviceType || 'UNKNOWN',
        messageData.responseTime
      );
      console.log(`✅ Status do serviço ${messageData.serviceId} atualizado para ${messageData.status}`);
    } catch (statusError) {
      console.error('⚠️ Erro ao atualizar status do serviço (continuando):', statusError);
    }
    
    // 5. Montar JSON padronizado
    return {
      service_name: messageData.serviceName,
      service_type: messageData.serviceType || 'UNKNOWN',
      status: messageData.status || 'UNKNOWN',
      response_time: messageData.responseTime,
      timestamp: payload.timestamp,
      event,
      users_to_notify: serviceInfo.usersToNotify.map((userNotif: any) => ({
        name: userNotif.User.name,
        email: userNotif.User.email
      })),
      service_info: serviceInfo
    };
  }

  private detectEventType(message: string): string {
    // Primeiro, tentar extrair o tipo de incidente do formato tokenizado
    const messageData = this.extractServiceDataFromMessage(message);
    if (messageData.incidentType) {
      const incidentType = messageData.incidentType.toUpperCase();
      
      // Mapear tipos de incidente para eventos
      switch (incidentType) {
        case 'INFO':
          // Para INFO, usar o status para determinar o evento
          if (messageData.status === 'UP') {
            return 'RESOLVED';
          } else if (messageData.status === 'DOWN') {
            return 'ALERT';
          }
          return 'INFO';
        case 'ALERT':
        case 'CRITICAL':
        case 'ERROR':
          return 'ALERT';
        case 'WARNING':
        case 'WARN':
          return 'WARNING';
        case 'RESOLVED':
        case 'RECOVERY':
        case 'OK':
          return 'RESOLVED';
        case 'MAINTENANCE':
          return 'MAINTENANCE';
        case 'INCIDENT':
          return 'INCIDENT';
        default:
          // Se não reconhecer o tipo, usar o status
          if (messageData.status === 'UP') {
            return 'RESOLVED';
          } else if (messageData.status === 'DOWN') {
            return 'ALERT';
          }
          return incidentType;
      }
    }
    
    // Fallback para análise do texto da mensagem (formato antigo)
    const upperMessage = message.toUpperCase();
    
    if (upperMessage.includes('DOWN') || upperMessage.includes('FAILED')) {
      return 'ALERT';
    } else if (upperMessage.includes('UP') || upperMessage.includes('RESTORED')) {
      return 'RESOLVED';
    } else if (upperMessage.includes('WARNING') || upperMessage.includes('DEGRADED')) {
      return 'WARNING';
    } else if (upperMessage.includes('MAINTENANCE')) {
      return 'MAINTENANCE';
    } else if (upperMessage.includes('INCIDENT')) {
      return 'INCIDENT';
    }
    
    return 'ALERT'; // Default
  }

  private extractServiceDataFromMessage(message: string): {
    serviceName?: string;
    serviceId?: number;
    serviceType?: string;
    status?: string;
    responseTime?: number;
    incidentType?: string;
    timestamp?: string;
  } {
    const result: any = {};
    
    console.log('🔍 Analisando mensagem:', message);
    
    // Novo formato tokenizado: 'INFO|API Gateway Service_20_HTTP|UP|HTTP|248ms|2025-09-07 17:02:50'
    if (message.includes('|')) {
      const tokens = message.split('|');
      
      if (tokens.length >= 6) {
        // Token 0: Tipo de incidente (INFO, ALERT, WARNING, etc.)
        result.incidentType = tokens[0].trim().toUpperCase();
        
        // Token 1: Nome_ID_Tipo do serviço (ex: "API Gateway Service_20_HTTP")
        const serviceToken = tokens[1].trim();
        const serviceMatch = serviceToken.match(/^(.+)_(\d+)_(\w+)$/);
        if (serviceMatch) {
          result.serviceName = serviceMatch[1].trim(); // "API Gateway Service"
          result.serviceId = parseInt(serviceMatch[2]); // 20
          result.serviceType = serviceMatch[3].toUpperCase(); // "HTTP"
          console.log('✅ Service data extraído do token:', result);
        } else {
          console.log('⚠️ Formato do service token não reconhecido:', serviceToken);
        }
        
        // Token 2: Status (UP, DOWN, etc.)
        result.status = tokens[2].trim().toUpperCase();
        
        // Token 3: Tipo (novamente) - pode ser usado para validação
        const serviceTypeValidation = tokens[3].trim().toUpperCase();
        if (result.serviceType && result.serviceType !== serviceTypeValidation) {
          console.log('⚠️ Inconsistência no tipo de serviço:', result.serviceType, 'vs', serviceTypeValidation);
        }
        
        // Token 4: Response time (ex: "248ms")
        const responseTimeToken = tokens[4].trim();
        const responseTimeMatch = responseTimeToken.match(/(\d+(?:\.\d+)?)(?:ms)?/);
        if (responseTimeMatch) {
          result.responseTime = parseFloat(responseTimeMatch[1]);
        }
        
        // Token 5: Timestamp
        result.timestamp = tokens[5].trim();
        
        console.log('✅ Dados extraídos do formato tokenizado:', result);
        return result;
      } else {
        console.log('⚠️ Formato tokenizado incompleto, tentando parsers alternativos');
      }
    }
    
    // Fallback para formatos antigos caso o tokenizado falhe
    // Padrão 1: "Service leo_19_PING is DOWN"
    const serviceMatch = message.match(/Service\s+([^_\s]+)_(\d+)_(\w+)\s+is\s+(\w+)/i);
    if (serviceMatch) {
      result.serviceName = serviceMatch[1]; // "leo"
      result.serviceId = parseInt(serviceMatch[2]); // 19
      result.serviceType = serviceMatch[3].toUpperCase(); // "PING"
      result.status = serviceMatch[4].toUpperCase(); // "DOWN"
      console.log('✅ Padrão 1 encontrado:', result);
    }
    
    // Se não encontrou o padrão acima, tentar padrões alternativos
    if (!result.serviceName) {
      // Padrão 2: "Service: leo_19_PING" ou linha "Service leo_19_PING"
      const altServiceMatch = message.match(/Service[:\s]+([^_\s]+)_(\d+)_(\w+)/i);
      if (altServiceMatch) {
        result.serviceName = altServiceMatch[1];
        result.serviceId = parseInt(altServiceMatch[2]);
        result.serviceType = altServiceMatch[3].toUpperCase();
        console.log('✅ Padrão 2 encontrado:', result);
      }
    }
    
    // Padrão 3: Buscar por linhas separadas (multiline)
    if (!result.serviceName) {
      const lines = message.split('\n');
      for (const line of lines) {
        const lineServiceMatch = line.match(/Service\s+([^_\s]+)_(\d+)_(\w+)/i);
        if (lineServiceMatch) {
          result.serviceName = lineServiceMatch[1];
          result.serviceId = parseInt(lineServiceMatch[2]);
          result.serviceType = lineServiceMatch[3].toUpperCase();
          console.log('✅ Padrão 3 encontrado na linha:', line, result);
          break;
        }
      }
    }
    
    // Extrair status se não foi encontrado acima
    if (!result.status) {
      const statusMatch = message.match(/Status[:\s]+(\w+)/i);
      if (statusMatch) {
        result.status = statusMatch[1].toUpperCase();
      }
      
      // Tentar encontrar status em "is DOWN" ou "is UP"
      if (!result.status) {
        const isStatusMatch = message.match(/is\s+(\w+)/i);
        if (isStatusMatch) {
          result.status = isStatusMatch[1].toUpperCase();
        }
      }
    }
    
    // Extrair tipo se não foi encontrado acima
    if (!result.serviceType) {
      const typeMatch = message.match(/Type[:\s]+(\w+)/i);
      if (typeMatch) {
        result.serviceType = typeMatch[1].toUpperCase();
      }
    }
    
    // Extrair response time se não foi encontrado acima
    if (!result.responseTime) {
      const responseTimeMatch = message.match(/response[_\s]?time[:\s]*(\d+(?:\.\d+)?)/i);
      if (responseTimeMatch) {
        result.responseTime = parseFloat(responseTimeMatch[1]);
      }
    }
    
    console.log('📋 Dados extraídos da mensagem:', result);
    
    return result;
  }

  private extractMessageData(message: string): { status?: string; response_time?: number } {
    const serviceData = this.extractServiceDataFromMessage(message);
    return {
      status: serviceData.status,
      response_time: serviceData.responseTime
    };
  }

  private async sendAlertNotifications(alertData: ProcessedAlert) {
    if (alertData.users_to_notify.length === 0) {
      console.log('⚠️ Nenhum usuário para notificar');
      return;
    }
    
    // 1. Salvar notificações na base de dados
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
    
    // 2. Enviar notificações por email
    // Montar mensagem personalizada
    const subject = `🚨 ${alertData.event}: ${alertData.service_name}`;
    
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
    
    // Extrair apenas os emails
    const emailAddresses = alertData.users_to_notify.map(user => user.email);
    
    try {
      // Enviar usando templates dinâmicos (seleção automática)
      await this.notificationsService.sendAlertWithTemplate(
        emailMessage.trim(),
        subject,
        emailAddresses,
        '', // Template será selecionado automaticamente
        {
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
        }
      );
      
      console.log(`📧 Notificação enviada para ${emailAddresses.length} usuários com template dinâmico:`, emailAddresses);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      // Fallback para envio simples
      await this.notificationsService.sendNotificationToEmail(
        emailMessage.trim(),
        subject,
        emailAddresses
      );
      console.log(`📧 Notificação enviada (fallback) para ${emailAddresses.length} usuários:`, emailAddresses);
    }
  }

  @Post()
  @ApiOperation({ 
    summary: 'Criar nova notificação',
    description: 'Cria uma nova notificação para um usuário específico'
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    type: NotificationResponseDto
  })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }
}
