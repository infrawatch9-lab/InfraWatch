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
import { WebhookProcessorUtil, AlertNotificationSender, AuthUtils } from './utils';

@ApiTags('Notifications Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsManagerController {
  private readonly webhookProcessor: WebhookProcessorUtil;
  private readonly alertSender: AlertNotificationSender;

  constructor(private readonly notificationsService: NotificationsManagerService) {
    this.webhookProcessor = new WebhookProcessorUtil(notificationsService);
    this.alertSender = new AlertNotificationSender(notificationsService);
  }

  @Get()
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
    const userId = AuthUtils.extractUserId(req);
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
    const userId = AuthUtils.extractUserId(req);
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
    const userId = AuthUtils.extractUserId(req);
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
    const userId = AuthUtils.extractUserId(req);
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
      // 1. Processar o payload do CheckCle usando a classe utilitária
      const processedAlert = await this.webhookProcessor.processWebhookPayload(payload);
      
      // 2. Enviar notificações usando a classe de envio
      await this.alertSender.sendAlertNotifications(processedAlert);
      
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
