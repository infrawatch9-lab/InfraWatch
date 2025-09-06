import { Test, TestingModule } from '@nestjs/testing';
import { CheckcleAuthService } from './checkcle-auth.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

describe('CheckcleAuthService', () => {
  let service: CheckcleAuthService;
  let httpService: HttpService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckcleAuthService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            checkcleToken: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CheckcleAuthService>(CheckcleAuthService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests here as needed
});
