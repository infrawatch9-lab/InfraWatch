import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService
  ) {}

    async createAlert(alertData: {
        serviceId: number;
        ruleId: number;
        message: string;
        usersToNotify: string[]
    }) {
        const alert = await this.prisma.alert.create({
            data: {
                serviceId: alertData.serviceId,
                ruleId: alertData.ruleId,
                message: alertData.message,
            },
        });
        this.eventEmitter.emit('alert.new', alert);
        this.notificationsService.sendAlert(alertData.message, alertData.usersToNotify);
        return alert;
    }

  async findAll() {
    return this.prisma.alert.findMany({
      orderBy: { triggeredAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.alert.findUnique({ where: { id } });
  }
}
