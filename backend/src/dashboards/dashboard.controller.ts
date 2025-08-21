import { Controller, Post, Sse, UseGuards, Body, Param, Get } from '@nestjs/common';
import { fromEventPattern, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dashboardService: DashboardService,
  ) {}

@Sse('dashboards/stream')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
streamDashboards(): Observable<{ data: any }> {
  return fromEventPattern(
    (handler) => this.eventEmitter.on('dashboard.updated', handler),
    (handler) => this.eventEmitter.off('dashboard.updated', handler),
  ).pipe(
    map((updatedDashboard) => ({ data: updatedDashboard })),
  );
}

@Get('/:id')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
getDashboard(@Param('id') id: number) {
  return this.dashboardService.findOne(id);
}

}