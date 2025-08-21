import { Controller, Get, Post, Body } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { MicroservicesGateway } from './ws/microservices.gateway';

@Controller('health')
export class AppController {

  @Get()
  @Public()
  getHealth() {
    // Dentro de algum serviço ou controller para teste
    return {
      success: true,
      message: 'InfraWatch API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}


@Controller('ws')
export class WebSocketController {
  constructor(private readonly gateway: MicroservicesGateway) {}

  @Post('send')
  @Public()
  sendMessage(@Body() body: { from: string; to: string; payload: any }) {
    this.gateway.handleMessageRest(body);
    return { status: 'Mensagem enviada', body };
  }
}