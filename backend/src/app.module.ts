import { Module } from '@nestjs/common';
import { AppController, NotificationsController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/ auth.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [UsersModule, MetricsModule, AuthModule, NotificationsModule],
  controllers: [AppController, NotificationsController],
})
export class AppModule {}
