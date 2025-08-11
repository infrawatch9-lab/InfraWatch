// test/setup.ts
import 'reflect-metadata';

// Mock do PrismaClient para testes
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    metric: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    alert: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  })),
  ServiceStatus: {
    UP: 'UP',
    DOWN: 'DOWN',
    DEGRADED: 'DEGRADED',
    PENDING: 'PENDING',
  },
}));

// Configuração global para testes
global.console = {
  ...console,
  // Suprimir logs desnecessários durante os testes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};