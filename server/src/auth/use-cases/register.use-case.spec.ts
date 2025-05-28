/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { FindUserByEmailUseCase } from '../../users/use-cases/find-user-by-email.use-case';
import { CreateUserUseCase } from '../../users/use-cases/create-user.use-case';
import { GenerateTokensUseCase } from './generate-tokens.use-case';
import { RegisterDto } from '../dto/register.dto';
import { faker } from '@faker-js/faker/locale/th';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let findUserByEmailUseCase: FindUserByEmailUseCase;
  let createUserUseCase: CreateUserUseCase;
  let generateTokensUseCase: GenerateTokensUseCase;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockEmail = faker.internet.email();
  const mockName = faker.person.fullName();
  const mockPassword = 'Password123!';

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    name: mockName,
    password: 'hashed_password',
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  // Mock services
  const mockFindUserByEmailUseCase = {
    execute: jest.fn(),
  };

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGenerateTokensUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        {
          provide: FindUserByEmailUseCase,
          useValue: mockFindUserByEmailUseCase,
        },
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: GenerateTokensUseCase,
          useValue: mockGenerateTokensUseCase,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
    findUserByEmailUseCase = module.get<FindUserByEmailUseCase>(
      FindUserByEmailUseCase,
    );
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    generateTokensUseCase = module.get<GenerateTokensUseCase>(
      GenerateTokensUseCase,
    );

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should register a new user successfully', async () => {
    // Arrange
    const registerDto: RegisterDto = {
      email: mockEmail,
      name: mockName,
      password: mockPassword,
    };

    mockFindUserByEmailUseCase.execute.mockResolvedValue(null); // User doesn't exist
    mockCreateUserUseCase.execute.mockResolvedValue(mockUser);
    mockGenerateTokensUseCase.execute.mockResolvedValue(mockTokens);

    // Act
    const result = await useCase.execute(registerDto);

    // Assert
    expect(result).toEqual({
      ...mockTokens,
      user: {
        id: mockUserId,
        email: mockEmail,
        name: mockName,
      },
    });

    // Verify services were called with correct parameters
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );

    expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 10);

    expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
        name: mockName,
        password: 'hashed_password',
      }),
    );

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        email: mockEmail,
      }),
    );
  });

  it('should throw ConflictException when email is already in use', async () => {
    // Arrange
    const registerDto: RegisterDto = {
      email: mockEmail,
      name: mockName,
      password: mockPassword,
    };

    mockFindUserByEmailUseCase.execute.mockResolvedValue(mockUser); // User exists

    // Act & Assert
    await expect(useCase.execute(registerDto)).rejects.toThrow(
      ConflictException,
    );
    await expect(useCase.execute(registerDto)).rejects.toThrow(
      'Email already in use',
    );

    // Verify services were called correctly
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );

    // Verify that user was not created and tokens were not generated
    expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
    expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
  });

  it('should correctly create DTOs for each step', async () => {
    // Arrange
    const registerDto: RegisterDto = {
      email: mockEmail,
      name: mockName,
      password: mockPassword,
    };

    mockFindUserByEmailUseCase.execute.mockResolvedValue(null);
    mockCreateUserUseCase.execute.mockResolvedValue(mockUser);
    mockGenerateTokensUseCase.execute.mockResolvedValue(mockTokens);

    // Act
    await useCase.execute(registerDto);

    // Assert - check that each DTO was created correctly
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );

    expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
        name: mockName,
        password: 'hashed_password',
      }),
    );

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        email: mockEmail,
      }),
    );
  });
});
