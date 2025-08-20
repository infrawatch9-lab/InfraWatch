import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {

    // Busca o serviço
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) return null;

    // Busca a métrica mais recente
    const metric = await this.prisma.metric.findFirst({
      where: { serviceId: id },
      orderBy: { timestamp: 'desc' },
    });

    // Busca SLAs
    const slas = await this.prisma.sLA.findMany({
      where: { serviceId: id },
      orderBy: { periodStart: 'desc' },
      take: 5,
    });

    // Busca logs recentes
    const logs = await this.prisma.systemLog.findMany({
      where: { serviceId: id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Busca alertas recentes
    const alerts = await this.prisma.alert.findMany({
      where: { serviceId: id },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });

    return {
      ...service,
      metrics: metric
        ? {
            cpu: metric.cpu,
            memory: metric.memory,
            latency: metric.latency,
            status: metric.status,
            errorMsg: metric.errorMsg,
            timestamp: metric.timestamp,
          }
        : null,
      slas,
      logs,
      alerts,
    };
  }
}
