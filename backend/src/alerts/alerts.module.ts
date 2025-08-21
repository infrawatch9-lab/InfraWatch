import { Module } from '@nestjs/common';
import { AlertService } from './alerts.service';
import { AlertController } from './alerts.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [AlertService, PrismaService],
  controllers: [AlertController],
  exports: [AlertService],
})

export class AlertModule {}
