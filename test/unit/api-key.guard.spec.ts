import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../../src/common/guards/api-key.guard.js';
import { jest } from '@jest/globals';

describe('ApiKeyGuard (unit)', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;
  let moduleRef: TestingModule;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = moduleRef.get<ApiKeyGuard>(ApiKeyGuard);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow request with valid API key in X-API-Key header', () => {
      const validApiKey = 'test-api-key-12345';
      mockConfigService.get.mockReturnValue({ apiKey: validApiKey });

      const context = createMockExecutionContext({
        'x-api-key': validApiKey,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      mockConfigService.get.mockReturnValue({ apiKey: 'valid-key' });

      const context = createMockExecutionContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      mockConfigService.get.mockReturnValue({ apiKey: 'valid-key' });

      const context = createMockExecutionContext({
        'x-api-key': 'invalid-key',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
