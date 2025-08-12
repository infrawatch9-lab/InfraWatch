import { Test, TestingModule } from '@nestjs/testing';
import { PingService } from './ping.service';
import { WebhookService } from './webhook.service';
import { ServiceStatus } from '@prisma/client'

describe('PingService', () => {
  let service: PingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PingService],
    }).compile();

    service = module.get<PingService>(PingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnectivity', () => {
    it('should ping Google DNS successfully', async () => {
      const result = await service.testConnectivity('8.8.8.8', 5000);
      
      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    }, 10000);

    it('should fail for invalid hostname', async () => {
      const result = await service.testConnectivity('invalid-host-12345.com', 3000);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  });

  describe('monitor', () => {
    it('should monitor a service successfully', async () => {
      const mockService = {
        id: 1,
        name: 'Google DNS',
        endpoint: '8.8.8.8',
      };

      const mockConfig = {
        timeout: 5000,
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(1);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    }, 10000);

    it('should handle service failure', async () => {
      const mockService = {
        id: 2,
        name: 'Invalid Service',
        endpoint: 'invalid-host-12345.com',
      };

      const mockConfig = {
        timeout: 3000,
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(2);
      expect(result.status).toBe(ServiceStatus.DOWN);
      expect(result.errorMessage).toBeDefined();
    }, 10000);
  });
});