import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController, WebSocketController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './services/services.module';
import { SlaModule } from './sla/sla.module';
import { DashboardModule } from './dashboards/dashboard.module';
import { AlertModule } from './alerts/alerts.module';
import { MicroservicesGateway } from './ws/microservices.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    DashboardModule,
    UsersModule,
    MetricsModule,
    AuthModule,
    NotificationsModule,
    ServicesModule,
    SlaModule,
    AlertModule
  ],
  controllers: [AppController, WebSocketController],
  providers: [MicroservicesGateway],
})

export class AppModule {}
