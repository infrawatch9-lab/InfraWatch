import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpDto } from './http.entity';
import { HttpOrchestrationService } from './http-orchestration.service';
import { HttpDatabaseService } from './http-database.service';

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);

  constructor(
    private readonly httpOrchestrationService: HttpOrchestrationService,
    private readonly httpDatabaseService: HttpDatabaseService,
  ) {}

  async create(createServiceDto: HttpDto): Promise<any> {
    try {
      return await this.httpOrchestrationService.createService(createServiceDto);
    } catch (error) {
      this.logger.error('Error creating HTTP service', error);
      throw new NotFoundException('Error creating HTTP service');
    }
  }

  async findAll(): Promise<any[]> {
    try {
      return await this.httpOrchestrationService.findAllServicesWithMonitoring();
    } catch (error) {
      this.logger.error('Error fetching HTTP services', error);
      throw new NotFoundException('Error fetching HTTP services');
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      return await this.httpOrchestrationService.findOneServiceWithMonitoring(id);
    } catch (error) {
      this.logger.error(`Error fetching HTTP service ${id}`, error);
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }
  }

  async update(serviceId: number, data: HttpDto): Promise<any> {
    try {
      return await this.httpOrchestrationService.updateService(serviceId, data);
    } catch (error) {
      this.logger.error(`Error updating HTTP service ${serviceId}`, error);
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }
  }

  async remove(id: number): Promise<any> {
    try {
      return await this.httpOrchestrationService.removeService(id);
    } catch (error) {
      this.logger.error(`Error removing HTTP service ${id}`, error);
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }
  }

  async removeAll(): Promise<any> {
    try {
      const result = await this.httpDatabaseService.deleteAllHttpServices();
      return { message: 'Todos os serviços de HTTP foram removidos com sucesso' };
    } catch (error) {
      this.logger.error('Error removing all HTTP services', error);
      throw new NotFoundException('Error removing all HTTP services');
    }
  }
}
