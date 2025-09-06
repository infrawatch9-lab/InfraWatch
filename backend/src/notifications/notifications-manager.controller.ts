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

interface AuthenticatedRequest {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

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
                  message: { type: 'string', example: 'Serviço Google está fora do ar' },
                  type: { type: 'string', enum: ['EMAIL', 'PUSH', 'SMS', 'SLACK', 'TELEGRAM'] },
                  channel: { type: 'string', enum: ['EMAIL', 'PUSH', 'SMS', 'SLACK', 'TELEGRAM', 'WEBHOOK'] },
                  sentAt: { type: 'string', format: 'date-time' },
                  isRead: { type: 'boolean', example: false },
                  readAt: { type: 'string', format: 'date-time', nullable: true },
                  alert: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'number' },
                      message: { type: 'string' },
                      service: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
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
