/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { ValidateUserUseCase } from './validate-user.use-case';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { LoginDto } from '../dto/login.dto';
import { faker } from '@faker-js/faker/locale/th';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let validateUserUseCase: ValidateUserUseCase;
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
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  // Mock services
  const mockValidateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGenerateTokensUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: ValidateUserUseCase,
          useValue: mockValidateUserUseCase,
        },
        {
          provide: GenerateTokensUseCase,
          useValue: mockGenerateTokensUseCase,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    validateUserUseCase = module.get<ValidateUserUseCase>(ValidateUserUseCase);
    generateTokensUseCase = module.get<GenerateTokensUseCase>(
      GenerateTokensUseCase,
    );

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should successfully login with valid credentials', async () => {
    // Arrange
    const loginDto: LoginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    mockValidateUserUseCase.execute.mockResolvedValue(mockUser);
    mockGenerateTokensUseCase.execute.mockResolvedValue(mockTokens);

    // Act
    const result = await useCase.execute(loginDto);

    // Assert
    expect(result).toEqual({
      ...mockTokens,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    });

    // Verify services were called with correct parameters
    expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        email: mockUser.email,
      }),
    );
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    // Arrange
    const loginDto: LoginDto = {
      email: 'wrong@example.com',
      password: 'WrongPassword123!',
    };

    mockValidateUserUseCase.execute.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(useCase.execute(loginDto)).rejects.toThrow(
      'Invalid credentials',
    );

    expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );

    // Verify that token generation was not called
    expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
  });

  it('should correctly construct TokenPayloadDto', async () => {
    // Arrange
    const loginDto: LoginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    mockValidateUserUseCase.execute.mockResolvedValue(mockUser);
    mockGenerateTokensUseCase.execute.mockResolvedValue(mockTokens);

    // Act
    await useCase.execute(loginDto);

    // Assert
    const expectedPayload = new TokenPayloadDto();
    expectedPayload.userId = mockUser.id;
    expectedPayload.email = mockUser.email;

    expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        email: mockUser.email,
      }),
    );
  });
});
