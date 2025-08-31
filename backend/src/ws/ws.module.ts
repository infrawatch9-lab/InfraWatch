import { Module } from '@nestjs/common';
import { MicroservicesGateway } from './microservices.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsManagerModule } from '../notifications/notifications-manager.module';
import { DatabaseModule } from '../database/database.module';
import { ConnectionManager } from './connection-manager.service';
import { MessageCacheService } from './message-cache.service';
import { MessageRouterService } from './message-router.service';
import { AlertProcessorService } from './alert-processor.service';
import { GatewayAdminService } from './gateway-admin.service';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    NotificationsManagerModule
  ],
  providers: [
    MicroservicesGateway,
    ConnectionManager,
    MessageCacheService,
    MessageRouterService,
    AlertProcessorService,
    GatewayAdminService
  ],
  exports: [
    MicroservicesGateway,
    ConnectionManager,
    MessageCacheService,
    MessageRouterService,
    AlertProcessorService,
    GatewayAdminService
  ],
})
export class MicroservicesModule {}
