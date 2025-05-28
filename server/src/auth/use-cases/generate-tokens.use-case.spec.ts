/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { faker } from '@faker-js/faker/locale/th';

// Mock UUID v4
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-refresh-token'),
}));

// Mock date-fns to return a predictable date
jest.mock('date-fns', () => ({
  add: jest.fn(() => new Date('2023-12-31')),
}));

describe('GenerateTokensUseCase', () => {
  let useCase: GenerateTokensUseCase;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockEmail = faker.internet.email();
  const mockAccessToken = 'mocked-access-token';
  const mockRefreshToken = 'mocked-refresh-token';

  // Mock services
  const mockJwtService = {
    sign: jest.fn().mockReturnValue(mockAccessToken),
  };

  const mockPrisma = {
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        token: mockRefreshToken,
        userId: mockUserId,
        expiresAt: new Date('2023-12-31'),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTokensUseCase,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<GenerateTokensUseCase>(GenerateTokensUseCase);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should generate access and refresh tokens', async () => {
    // Arrange
    const payload: TokenPayloadDto = {
      userId: mockUserId,
      email: mockEmail,
    };

    // Act
    const result = await useCase.execute(payload);

    // Assert
    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });

    // Verify JWT service was called correctly
    expect(mockJwtService.sign).toHaveBeenCalledWith(
      { email: mockEmail, sub: mockUserId },
      { expiresIn: '15m' },
    );

    // Verify prisma service was called correctly to save refresh token
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        token: mockRefreshToken,
        userId: mockUserId,
        expiresAt: new Date('2023-12-31'),
      },
    });
  });

  it('should handle different user payloads', async () => {
    // Arrange
    const differentUserId = faker.string.uuid();
    const differentEmail = faker.internet.email();

    const payload: TokenPayloadDto = {
      userId: differentUserId,
      email: differentEmail,
    };

    // Act
    await useCase.execute(payload);

    // Assert
    expect(mockJwtService.sign).toHaveBeenCalledWith(
      { email: differentEmail, sub: differentUserId },
      { expiresIn: '15m' },
    );

    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        token: mockRefreshToken,
        userId: differentUserId,
        expiresAt: expect.any(Date),
      },
    });
  });

  it('should throw an error if refresh token creation fails', async () => {
    // Arrange
    mockPrisma.refreshToken.create.mockRejectedValueOnce(
      new Error('Database error'),
    );

    const payload: TokenPayloadDto = {
      userId: mockUserId,
      email: mockEmail,
    };

    // Act & Assert
    await expect(useCase.execute(payload)).rejects.toThrow('Database error');

    // Verify JWT was still created
    expect(mockJwtService.sign).toHaveBeenCalled();
  });
});
