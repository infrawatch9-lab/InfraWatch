import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CheckcleAuthService } from './checkcle-auth.service';
import { CheckcleAuthController } from './checkcle-auth.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule],
  controllers: [CheckcleAuthController],
  providers: [CheckcleAuthService],
  exports: [CheckcleAuthService],
})
export class CheckcleAuthModule {}
