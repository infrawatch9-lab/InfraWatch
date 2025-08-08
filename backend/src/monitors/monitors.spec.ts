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

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('monitor', () => {
    it('should monitor HTTP service successfully', async () => {
      const mockService = {
        id: 1,
        name: 'JSONPlaceholder API',
        endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
      };

      const mockConfig = {
        timeout: 5000,
        method: 'GET',
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(1);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.httpStatus).toBe(200);
    }, 10000);

    it('should handle HTTP service failure', async () => {
      const mockService = {
        id: 2,
        name: 'Invalid HTTP Service',
        endpoint: 'https://invalid-url-test-12345.com/api',
      };

      const mockConfig = {
        timeout: 3000,
        method: 'GET',
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(2);
      expect(result.status).toBe(ServiceStatus.DOWN);
      expect(result.errorMessage).toBeDefined();
    }, 10000);

    it('should handle timeout correctly', async () => {
      const mockService = {
        id: 3,
        name: 'Slow Service',
        endpoint: 'https://httpbin.org/delay/10', // 10 second delay
      };

      const mockConfig = {
        timeout: 2000, // 2 second timeout
        method: 'GET',
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(3);
      expect(result.status).toBe(ServiceStatus.DOWN);
      expect(result.errorMessage).toContain('Timeout');
    }, 15000);

    it('should handle custom status codes', async () => {
      const mockService = {
        id: 4,
        name: 'Custom Status Service',
        endpoint: 'https://httpbin.org/status/201',
      };

      const mockConfig = {
        timeout: 5000,
        method: 'GET',
        expectedStatusCodes: JSON.stringify([201, 202]),
      };

      const result = await service.monitor(mockService, mockConfig);

      expect(result.serviceId).toBe(4);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.metrics?.httpStatus).toBe(201);
    }, 10000);
  });

  describe('monitorWebhook', () => {
    it('should monitor webhook with default payload', async () => {
      const mockService = {
        id: 5,
        name: 'Webhook Test',
        endpoint: 'https://httpbin.org/post',
      };

      const mockConfig = {
        timeout: 5000,
      };

      const result = await service.monitorWebhook(mockService, mockConfig);

      expect(result.serviceId).toBe(5);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.httpStatus).toBe(200);
    }, 10000);

    it('should monitor webhook with custom payload', async () => {
      const mockService = {
        id: 6,
        name: 'Custom Webhook Test',
        endpoint: 'https://httpbin.org/post',
      };

      const mockConfig = {
        timeout: 5000,
      };

      const customPayload = {
        event: 'test_event',
        data: {
          user_id: 123,
          action: 'login',
        },
        timestamp: new Date().toISOString(),
      };

      const result = await service.monitorWebhook(mockService, mockConfig, customPayload);

      expect(result.serviceId).toBe(6);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.metrics?.httpStatus).toBe(200);
    }, 10000);

    it('should handle webhook failure', async () => {
      const mockService = {
        id: 7,
        name: 'Failed Webhook',
        endpoint: 'https://invalid-webhook-url-12345.com/webhook',
      };

      const mockConfig = {
        timeout: 3000,
      };

      const result = await service.monitorWebhook(mockService, mockConfig);

      expect(result.serviceId).toBe(7);
      expect(result.status).toBe(ServiceStatus.DOWN);
      expect(result.errorMessage).toBeDefined();
    }, 10000);

    it('should send POST request with correct headers', async () => {
      const mockService = {
        id: 8,
        name: 'Header Test Webhook',
        endpoint: 'https://httpbin.org/post',
      };

      const mockConfig = {
        timeout: 5000,
        headers: JSON.stringify({
          'X-Custom-Header': 'test-value',
        }),
      };

      const result = await service.monitorWebhook(mockService, mockConfig);

      expect(result.serviceId).toBe(8);
      expect(result.status).toBe(ServiceStatus.UP);
      expect(result.metrics?.httpStatus).toBe(200);
    }, 10000);
  });

  describe('checkSSLCertificate', () => {
    it('should validate SSL certificate for HTTPS endpoint', async () => {
      const mockService = {
        id: 9,
        name: 'HTTPS Service',
        endpoint: 'https://jsonplaceholder.typicode.com',
      };

      const result = await service.checkSSLCertificate(mockService);

      expect(result.valid).toBe(true);
      expect(result.protocol).toBe('TLS');
      expect(result.status).toBe(200);
    }, 10000);

    it('should return invalid for HTTP endpoint', async () => {
      const mockService = {
        id: 10,
        name: 'HTTP Service',
        endpoint: 'http://jsonplaceholder.typicode.com',
      };

      const result = await service.checkSSLCertificate(mockService);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Not HTTPS');
    });

    it('should handle invalid SSL certificate', async () => {
      const mockService = {
        id: 11,
        name: 'Invalid SSL Service',
        endpoint: 'https://invalid-ssl-test-12345.com',
      };

      const result = await service.checkSSLCertificate(mockService);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  });

  describe('utility methods', () => {
    it('should parse headers correctly', async () => {
      const validHeaders = '{"Content-Type": "application/json", "Authorization": "Bearer token"}';
      const result = service['parseHeaders'](validHeaders);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });
    });

    it('should return empty object for invalid headers', async () => {
      const invalidHeaders = 'invalid-json';
      const result = service['parseHeaders'](invalidHeaders);

      expect(result).toEqual({});
    });

    it('should parse body correctly', async () => {
      const validBody = '{"key": "value"}';
      const result = service['parseBody'](validBody);

      expect(result).toBe('{"key":"value"}');
    });

    it('should return original body for invalid JSON', async () => {
      const invalidBody = 'plain text body';
      const result = service['parseBody'](invalidBody);

      expect(result).toBe('plain text body');
    });

    it('should parse expected status codes correctly', async () => {
      const validCodes = '[200, 201, 202]';
      const result = service['parseExpectedStatusCodes'](validCodes);

      expect(result).toEqual([200, 201, 202]);
    });

    it('should return default for invalid status codes', async () => {
      const invalidCodes = 'invalid-json';
      const result = service['parseExpectedStatusCodes'](invalidCodes);

      expect(result).toEqual([200]);
    });
  });
});