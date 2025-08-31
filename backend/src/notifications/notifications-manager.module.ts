import { Module } from '@nestjs/common';
import { NotificationsManagerController } from './notifications-manager.controller';
import { NotificationsManagerService } from './notifications-manager.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsManagerController],
  providers: [NotificationsManagerService],
  exports: [NotificationsManagerService]
})
export class NotificationsManagerModule {}
