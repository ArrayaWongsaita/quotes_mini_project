/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LogoutUseCase } from './logout.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { faker } from '@faker-js/faker/locale/th';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let prismaService: PrismaService;

  // Mock data
  const mockRefreshToken = faker.string.uuid();

  // Mock for PrismaService
  const mockPrisma = {
    refreshToken: {
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<LogoutUseCase>(LogoutUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should successfully logout with valid refresh token', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    mockPrisma.refreshToken.delete.mockResolvedValue({
      id: faker.string.uuid(),
      token: mockRefreshToken,
      userId: faker.string.uuid(),
      expiresAt: faker.date.future(),
    });

    // Act
    const result = await useCase.execute(refreshTokenDto);

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token: mockRefreshToken },
    });
  });

  it('should throw NotFoundException when refresh token not found', async () => {
    // Arrange
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'non-existent-token',
    };

    mockPrisma.refreshToken.delete.mockRejectedValue(
      new Error('Record not found'),
    );

    // Act & Assert
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute(refreshTokenDto)).rejects.toThrow(
      'Refresh token not found',
    );

    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token: 'non-existent-token' },
    });
  });
});
