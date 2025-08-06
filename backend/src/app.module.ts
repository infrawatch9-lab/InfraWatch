import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/ auth.module';

@Module({
  imports: [UsersModule, MetricsModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
