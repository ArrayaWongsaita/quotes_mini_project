/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { faker } from '@faker-js/faker/locale/th';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let prismaService: PrismaService;
  let generateTokensUseCase: GenerateTokensUseCase;

  // Mock data
  const mockRefreshToken = faker.string.uuid();
  const mockUserId = faker.string.uuid();
  const mockUserName = faker.person.fullName();
  const mockUserEmail = faker.internet.email();
  const mockRefreshTokenId = faker.string.uuid();

  // Mock services
  const mockPrisma = {
    refreshToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGenerateTokensUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: GenerateTokensUseCase,
          useValue: mockGenerateTokensUseCase,
        },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    generateTokensUseCase = module.get<GenerateTokensUseCase>(
      GenerateTokensUseCase,
    );

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should refresh tokens successfully with a valid refresh token', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    const mockRefreshTokenData = {
      id: mockRefreshTokenId,
      token: mockRefreshToken,
      userId: mockUserId,
      expiresAt: faker.date.future(),
      user: {
        id: mockUserId,
        email: mockUserEmail,
        name: mockUserName,
        password: 'hashed_password',
      },
    };

    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenData);
    mockPrisma.refreshToken.delete.mockResolvedValue({});
    mockGenerateTokensUseCase.execute.mockResolvedValue(mockNewTokens);

    // Act
    const result = await useCase.execute(refreshTokenDto);

    // Assert
    expect(result).toEqual({
      ...mockNewTokens,
      user: {
        id: mockUserId,
        email: mockUserEmail,
        name: mockUserName,
      },
    });

    // Verify services were called with correct parameters
    expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: mockRefreshToken },
      include: { user: true },
    });

    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: mockRefreshTokenId },
    });

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        email: mockUserEmail,
      }),
    );
  });

  it('should throw UnauthorizedException when refresh token is invalid', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'invalid-token',
    };

    mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      'Invalid refresh token',
    );

    expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'invalid-token' },
      include: { user: true },
    });

    // Verify that no further actions were taken
    expect(mockPrisma.refreshToken.delete).not.toHaveBeenCalled();
    expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when refresh token is expired', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    const mockExpiredRefreshToken = {
      id: mockRefreshTokenId,
      token: mockRefreshToken,
      userId: mockUserId,
      expiresAt: faker.date.past(), // Important: this is in the past
      user: {
        id: mockUserId,
        email: mockUserEmail,
        name: mockUserName,
        password: 'hashed_password',
      },
    };

    mockPrisma.refreshToken.findUnique.mockResolvedValue(
      mockExpiredRefreshToken,
    );
    mockPrisma.refreshToken.delete.mockResolvedValue({});

    // Act & Assert
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      'Refresh token expired',
    );

    // Verify that the expired token was deleted
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: mockRefreshTokenId },
    });

    // But no new tokens were generated
    expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
  });

  it('should correctly construct TokenPayloadDto', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    const mockRefreshTokenData = {
      id: mockRefreshTokenId,
      token: mockRefreshToken,
      userId: mockUserId,
      expiresAt: faker.date.future(),
      user: {
        id: mockUserId,
        email: mockUserEmail,
        name: mockUserName,
        password: 'hashed_password',
      },
    };

    mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenData);
    mockPrisma.refreshToken.delete.mockResolvedValue({});
    mockGenerateTokensUseCase.execute.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    // Act
    await useCase.execute(refreshTokenDto);

    // Assert
    const expectedPayload = new TokenPayloadDto();
    expectedPayload.userId = mockUserId;
    expectedPayload.email = mockUserEmail;

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        email: mockUserEmail,
      }),
    );
  });
});
