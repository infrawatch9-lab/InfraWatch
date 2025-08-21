import { Module } from '@nestjs/common';
import { MicroservicesGateway } from './microservices.gateway';

@Module({
  providers: [MicroservicesGateway],
  exports: [MicroservicesGateway],
})
export class MicroservicesModule {}
