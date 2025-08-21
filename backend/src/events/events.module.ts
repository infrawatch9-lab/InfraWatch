import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()], // inicializa o EventEmitter global
  exports: [EventEmitterModule],           // permite que outros módulos injetem
})
export class EventsModule {}
