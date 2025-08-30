import { Module } from '@nestjs/common';
import { MicroservicesGateway } from './microservices.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../database/prisma.service';


@Module({
  imports: [NotificationsModule],
  providers: [MicroservicesGateway, PrismaService],
  exports: [MicroservicesGateway],
})

export class MicroservicesModule {}
