import { Controller, Get, Post, Body, Param, ParseIntPipe, Sse, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { AlertService } from './alerts.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEventPattern, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('alerts')
@Controller('alerts')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('stream')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  streamAlerts(): Observable<{ data: any }> {
    console.log('SSE connection established for alerts');
    return fromEventPattern(
      (handler) => {
        console.log('Registrando listener para alert.new');
        this.eventEmitter.on('alert.new', handler);
      },
      (handler) => {
        console.log('Removendo listener para alert.new');
        this.eventEmitter.off('alert.new', handler);
      },
    ).pipe(
      map((alert) => {
        console.log('Evento recebido no SSE:', alert);
        return { data: alert };
      }),
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os alertas' })
  findAll() {
    return this.alertService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter um alerta pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo alerta' })
  create(@Body() body: any) {
    return this.alertService.createAlert(body);
  }
}
