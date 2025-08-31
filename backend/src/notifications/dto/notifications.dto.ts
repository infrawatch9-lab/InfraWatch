import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID do usuário que receberá a notificação' })
  userId!: number;

  @ApiPropertyOptional({ description: 'ID do alerta relacionado' })
  alertId!: number;

  @ApiProperty({ description: 'Mensagem da notificação' })
  message!: string;

  @ApiProperty({ 
    description: 'Tipo da notificação',
    enum: NotificationType,
    enumName: 'NotificationType'
  })
  type!: NotificationType;

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

  @ApiProperty({ description: 'ID do usuário' })
  userId!: number;

  @ApiPropertyOptional({ description: 'ID do alerta relacionado' })
  alertId?: number;

  @ApiProperty({ description: 'Mensagem da notificação' })
  message!: string;

  @ApiProperty({ description: 'Tipo da notificação', enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ description: 'Canal da notificação', enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty({ description: 'Data de envio da notificação' })
  sentAt!: Date;

  @ApiProperty({ description: 'Se a notificação foi lida' })
  isRead!: boolean;

  @ApiPropertyOptional({ description: 'Data de leitura da notificação' })
  readAt?: Date;
}

export class NotificationPaginationOptionsDto {
  @ApiPropertyOptional({ description: 'Número da página', default: 1, minimum: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Quantidade por página', default: 20, minimum: 1, maximum: 100 })
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Buscar apenas não lidas', default: false })
  unreadOnly?: boolean = false;
}
