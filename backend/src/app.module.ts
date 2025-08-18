import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { NotificationsController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/ auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './services/services.module';
import { DashboardModule } from './dashboards/dashboard.module';
import { WebhookModule } from './services/webhook/webhook.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    WebhookModule,
    DashboardModule,
    UsersModule,
    MetricsModule,
    AuthModule,
    NotificationsModule,
    ServicesModule,
  ],
  controllers: [AppController, NotificationsController],
})
export class AppModule {}
