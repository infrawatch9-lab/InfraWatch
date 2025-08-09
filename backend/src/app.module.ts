import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'
import { AppController, NotificationsController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from "./auth/ auth.module";
import { NotificationsModule } from './notifications/notifications.module';
import { MonitorsModule } from './monitors/monitors.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    MetricsModule,
    AuthModule,
    NotificationsModule,
    MonitorsModule,
  ],
  controllers: [AppController, NotificationsController],
})
export class AppModule {}
