import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('health')
export class AppController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Get()
  @Public()
  getHealth() {
    // Dentro de algum serviço ou controller para teste
    this.eventEmitter.emit('alert.new', { id: 123, message: 'Teste SSE' });
    return {
      success: true,
      message: 'InfraWatch API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}