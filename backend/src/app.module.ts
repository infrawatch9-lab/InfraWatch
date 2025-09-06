import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsManagerModule } from './notifications/notifications-manager.module';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './services/services.module';
import { SlaModule } from './sla/sla.module';
import { DashboardModule } from './dashboards/dashboard.module';
import { AlertModule } from './alerts/alerts.module';
import { AlertService } from './alerts/alerts.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    DashboardModule,
    UsersModule,
    MetricsModule,
    AuthModule,
    NotificationsManagerModule,
    ServicesModule,
    SlaModule,
    AlertModule,
  ],
  controllers: [AppController],
  providers: [AlertService],
})

export class AppModule {}
