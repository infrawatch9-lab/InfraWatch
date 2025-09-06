import { Module } from '@nestjs/common';
import { AlertService } from './alerts.service';
import { AlertController } from './alerts.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { NotificationsManagerModule } from '../notifications/notifications-manager.module';
@Module({
  imports: [NotificationsManagerModule],
  providers: [AlertService, PrismaService],
  controllers: [AlertController],
  exports: [AlertService],
})

export class AlertModule {}
