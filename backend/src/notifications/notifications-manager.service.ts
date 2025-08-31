import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto, NotificationPaginationOptionsDto } from './dto/notifications.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsManagerService {
  private readNotificationsCache = new Set<number>();

  constructor(private prisma: PrismaService) {}

  async getAllNotifications(
    userId: number,
    options: NotificationPaginationOptionsDto
  ) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      // Condições de busca
      const where: Prisma.NotificationWhereInput = {
        userId
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
            sentAt: 'desc'
          },
          skip,
          take: limit
        }),
        this.prisma.notification.count({ where })
      ]);

      // Simular status de leitura usando cache local
      let filteredNotifications = notifications.map(notification => {
        const isRead = this.readNotificationsCache.has(notification.id);
        return {
          id: notification.id,
          message: notification.message,
          type: notification.type,
          channel: notification.channel,
          sentAt: notification.sentAt,
          isRead,
          readAt: isRead ? new Date() : null, // Simular data de leitura
          alert: notification.Alert ? {
            id: notification.Alert.id,
            message: notification.Alert.message,
            service: {
              name: notification.Alert.Service.name,
              type: notification.Alert.Service.type
            }
          } : null
        };
      });

      // Filtrar apenas não lidas se solicitado
      if (unreadOnly) {
        filteredNotifications = filteredNotifications.filter(n => !n.isRead);
      }

      const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          notifications: filteredNotifications,
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
      // Buscar todas as notificações do usuário
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        select: { id: true }
      });

      // Contar quantas não estão no cache de lidas
      const unreadCount = notifications.filter(n => !this.readNotificationsCache.has(n.id)).length;

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

      const isAlreadyRead = this.readNotificationsCache.has(notificationId);
      
      if (isAlreadyRead) {
        return {
          success: true,
          data: {
            id: notification.id,
            isRead: true,
            readAt: new Date(),
            message: 'Notificação já estava marcada como lida'
          }
        };
      }

      // Marcar como lida no cache
      this.readNotificationsCache.add(notificationId);

      return {
        success: true,
        data: {
          id: notification.id,
          isRead: true,
          readAt: new Date()
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
      // Buscar todas as notificações do usuário
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        select: { id: true }
      });

      // Marcar todas como lidas no cache
      let updatedCount = 0;
      notifications.forEach(notification => {
        if (!this.readNotificationsCache.has(notification.id)) {
          this.readNotificationsCache.add(notification.id);
          updatedCount++;
        }
      });

      return {
        success: true,
        data: {
          updatedCount
        }
      };
    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      throw new BadRequestException('Erro ao marcar todas as notificações como lidas');
    }
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: createNotificationDto.userId,
          alertId: createNotificationDto.alertId,
          message: createNotificationDto.message,
          type: createNotificationDto.type,
          channel: createNotificationDto.channel
        },
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
        }
      });

      return {
        success: true,
        data: {
          id: notification.id,
          userId: notification.userId,
          alertId: notification.alertId,
          message: notification.message,
          type: notification.type,
          channel: notification.channel,
          sentAt: notification.sentAt,
          isRead: false,
          readAt: null,
          alert: notification.Alert ? {
            id: notification.Alert.id,
            message: notification.Alert.message,
            service: {
              name: notification.Alert.Service.name,
              type: notification.Alert.Service.type
            }
          } : null
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
          sentAt: {
            lt: cutoffDate
          }
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
}
