import { Test, TestingModule } from '@nestjs/testing';
import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { PingService } from './ping.service';
import { WebhookService } from './webhook.service';
import { SnmpService } from './snmp.service';
import { ServiceStatus } from '@prisma/client';

describe('MonitorsController', () => {
  let controller: MonitorsController;
  let monitorsService: jest.Mocked<MonitorsService>;
  let pingService: jest.Mocked<PingService>;
  let webhookService: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitorsController],
      providers: [
        {
          provide: MonitorsService,
          useValue: {
            getMonitoringStats: jest.fn(),
            addService: jest.fn(),
            removeService: jest.fn(),
            getServiceById: jest.fn(),
            cleanupOldMetrics: jest.fn(),
            onModuleInit: jest.fn(),
          },
        },
        {
          provide: PingService,
          useValue: {
            testConnectivity: jest.fn(),
            monitor: jest.fn(),
          },
        },
        {
          provide: WebhookService,
          useValue: {
            monitor: jest.fn(),
            checkSSLCertificate: jest.fn(),
          },
        },
        {
          provide: SnmpService,
          useValue: {
            monitor: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MonitorsController>(MonitorsController);
    monitorsService = module.get(MonitorsService);
    pingService = module.get(PingService);
    webhookService = module.get(WebhookService);
  });

  describe('getMonitoringHealth', () => {
    it('should return healthy status', async () => {
      monitorsService.getMonitoringStats.mockReturnValue({
        activeMonitors: 5,
        monitoredServices: [1, 2, 3, 4, 5],
      });

      const result = await controller.getMonitoringHealth();

      expect(result.success).toBe(true);
      expect(result.healthy).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.systemStatus).toBe('HEALTHY');
        expect(result.data.activeMonitors).toBe(5);
      }
    });
  });

  describe('testPing', () => {
    it('should test ping connectivity', async () => {
      const mockResult = { success: true, latency: 50 };
      pingService.testConnectivity.mockResolvedValue(mockResult);

      const result = await controller.testPing({
        hostname: '8.8.8.8',
        timeout: 5000,
      });

      expect(result.hostname).toBe('8.8.8.8');
      expect(result.success).toBe(true);
      expect(result.latency).toBe(50);
      expect(pingService.testConnectivity).toHaveBeenCalledWith('8.8.8.8', 5000);
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring a service', async () => {
      monitorsService.addService.mockResolvedValue(undefined);

      const result = await controller.startMonitoring(1);

      expect(result.success).toBe(true);
      expect(result.serviceId).toBe(1);
      expect(monitorsService.addService).toHaveBeenCalledWith(1);
    });
  });

  describe('testWebhook', () => {
    it('should test webhook endpoint', async () => {
      const mockResult = {
        serviceId: 1,
        status: ServiceStatus.UP,
        latency: 200,
        metrics: { httpStatus: 200 },
        timestamp: new Date(),
      };
      webhookService.monitor.mockResolvedValue(mockResult);

      const result = await controller.testWebhook({
        url: 'https://httpbin.org/get',
        method: 'GET',
        timeout: 5000,
      });

      expect(result.success).toBe(true);
      expect(result.webhook).toBe('https://httpbin.org/get');
      expect(webhookService.monitor).toHaveBeenCalled();
    });
  });

  describe('testMultipleHttp', () => {
    it('should test multiple HTTP endpoints', async () => {
      webhookService.monitor.mockResolvedValue({
        serviceId: 1,
        status: ServiceStatus.UP,
        latency: 150,
        metrics: { httpStatus: 200 },
        timestamp: new Date(),
      });

      const result = await controller.testMultipleHttp({
        endpoints: [
          { url: 'https://google.com' },
          { url: 'https://github.com' },
        ],
      });

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
    });
  });
});