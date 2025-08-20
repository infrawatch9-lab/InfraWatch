import { Controller, Sse, UseGuards } from '@nestjs/common';
import { fromEventPattern, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
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
}
