import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Atualiza dashboard e dispara evento
  async updateDashboard(id: number, data: any) {
    const updated = await this.prisma.service.update({
      where: { id },
      data,
    });

    this.eventEmitter.emit('dashboard.updated', updated);
    return updated;
  }

  // Para SSE: lista todos os dashboards
  async findAll() {
    return this.prisma.service.findMany();
  }

  // Buscar um dashboard específico
  async findOne(id: number) {
    return this.prisma.service.findUnique({ where: { id } });
  }
}
