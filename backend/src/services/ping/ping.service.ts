import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreatePingServiceDto,
} from './ping.entity';
import { PingOrchestrationService } from './ping-orchestration.service';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(
    private readonly pingOrchestrationService: PingOrchestrationService,
  ) {}

  async createPingService(data: CreatePingServiceDto): Promise<any> {
    return await this.pingOrchestrationService.createPingService(data);
  }

  async findAll(): Promise<any[]> {
    return await this.pingOrchestrationService.findAllServices();
  }

  async findOne(id: number): Promise<any> {
    return await this.pingOrchestrationService.findOneService(id);
  }

  async update(serviceId: number, data: CreatePingServiceDto): Promise<any> {
    return await this.pingOrchestrationService.updateService(serviceId, data);
  }

  async remove(id: number): Promise<any> {
    return await this.pingOrchestrationService.removeService(id);
  }

  async removeAll(): Promise<any> {
    return await this.pingOrchestrationService.removeAllServices();
  }

  async updateStatus(id: number, status: 'ACTIVE' | 'INACTIVE', action: string): Promise<any> {
    return await this.pingOrchestrationService.controlServiceStatus(id, action as 'resume' | 'pause');
  }

  async updateStatus2(id: number, status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING'): Promise<any> {
    return await this.pingOrchestrationService.updateHealthStatus(id, status);
  }

  async getCheckcleServiceStatus(serviceId: number): Promise<any> {
    return await this.pingOrchestrationService.getCheckcleServiceStatus(serviceId);
  }

  async syncAllServicesStatus(): Promise<any[]> {
    return await this.pingOrchestrationService.syncAllServicesStatus();
  }
}