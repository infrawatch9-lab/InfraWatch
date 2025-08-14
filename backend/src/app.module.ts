import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { NotificationsController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/ auth.module';
import { NotificationsModule } from './notifications/notifications.module';
// import { MonitorsModule } from './monitors/monitors.module';
import { MonitorsModule } from './monitors_dois/monitor.module';
import { DatabaseModule } from './database/database.module';
import { SnmpModule } from './services/snmp/snmp.module';
import { ServicesModule } from './services/services.module';
import { DashboardModule } from './dashboards/dashboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    DashboardModule,
    UsersModule,
    MetricsModule,
    AuthModule,
    NotificationsModule,
    // MonitorsModule,
    ServicesModule,
    // SnmpModule,
  ],
  controllers: [AppController, NotificationsController],
})
export class AppModule {}
