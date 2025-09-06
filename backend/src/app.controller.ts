import { Controller, Get, Post, Body } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { AlertService } from './alerts/alerts.service';
import { EmailService } from './notifications/email.service';

@Controller('health')
export class AppController {
  constructor(
    private readonly alertService: AlertService,
    private readonly emailService: EmailService,
  ) {}
  @Get()
  @Public()
  getHealth() {
    return {
      success: true,
      message: 'InfraWatch API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}