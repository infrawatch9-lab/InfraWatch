import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID do usuário que receberá a notificação' })
  userId!: number;

  @ApiPropertyOptional({ description: 'ID do alerta relacionado' })
  alertId?: number;

  @ApiProperty({ description: 'Título da notificação' })
  title!: string;

  @ApiProperty({ description: 'Conteúdo da notificação' })
  content!: string;

  @ApiPropertyOptional({ description: 'Mensagem (compatibilidade)' })
  message?: string;

  @ApiProperty({ 
    description: 'Tipo da notificação',
    enum: ['info', 'warning', 'success', 'error'],
    example: 'info'
  })
  type!: 'info' | 'warning' | 'success' | 'error';

  @ApiProperty({ 
    description: 'Canal da notificação',
    enum: NotificationChannel,
    enumName: 'NotificationChannel'
  })
  channel!: NotificationChannel;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'IDs das notificações a serem marcadas como lidas' })
  notificationIds!: number[];
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID da notificação' })
  id!: number;

  @ApiProperty({ description: 'Tipo da notificação', enum: ['info', 'warning', 'success', 'error'] })
  type!: 'info' | 'warning' | 'success' | 'error';

  @ApiProperty({ description: 'Título da notificação' })
  title!: string;

  @ApiProperty({ description: 'Conteúdo da notificação' })
  content!: string;

  @ApiProperty({ description: 'Data da notificação' })
  timestamp!: string;

  @ApiProperty({ description: 'Se a notificação foi lida' })
  read!: boolean;
}

export class NotificationPaginationOptionsDto {
  @ApiPropertyOptional({ description: 'Número da página', default: 1, minimum: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Quantidade por página', default: 20, minimum: 1, maximum: 100 })
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Buscar apenas não lidas', default: false })
  unreadOnly?: boolean = false;
}
