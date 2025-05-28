/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateUserUseCase } from './validate-user.use-case';
import { FindUserByEmailUseCase } from '../../users/use-cases/find-user-by-email.use-case';
import { faker } from '@faker-js/faker/locale/th';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('ValidateUserUseCase', () => {
  let useCase: ValidateUserUseCase;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let findUserByEmailUseCase: FindUserByEmailUseCase;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockEmail = faker.internet.email();
  const mockName = faker.person.fullName();
  const mockPassword = 'Password123!';
  const mockHashedPassword = 'hashed_password';

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    name: mockName,
    password: mockHashedPassword,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  // Mock for FindUserByEmailUseCase
  const mockFindUserByEmailUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateUserUseCase,
        {
          provide: FindUserByEmailUseCase,
          useValue: mockFindUserByEmailUseCase,
        },
      ],
    }).compile();

    useCase = module.get<ValidateUserUseCase>(ValidateUserUseCase);
    findUserByEmailUseCase = module.get<FindUserByEmailUseCase>(
      FindUserByEmailUseCase,
    );

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return user without password when credentials are valid', async () => {
    // Arrange
    mockFindUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Act
    const result = await useCase.execute(mockEmail, mockPassword);

    // Assert
    // First ensure the result is not null
    expect(result).not.toBeNull();

    // Then do further assertions (safely, since we've checked it's not null)
    if (result) {
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect('password' in result).toBe(false);
    }

    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockPassword,
      mockHashedPassword,
    );
  });

  it('should return null when password is incorrect', async () => {
    // Arrange
    mockFindUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // Act
    const result = await useCase.execute(mockEmail, 'wrong_password');

    // Assert
    expect(result).toBeNull();
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'wrong_password',
      mockHashedPassword,
    );
  });

  it('should return null when user is not found', async () => {
    // Arrange
    mockFindUserByEmailUseCase.execute.mockResolvedValue(null);

    // Act
    const result = await useCase.execute(
      'nonexistent@example.com',
      mockPassword,
    );

    // Assert
    expect(result).toBeNull();
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nonexistent@example.com',
      }),
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('should correctly construct FindUserByEmailDto', async () => {
    // Arrange
    mockFindUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Act
    await useCase.execute(mockEmail, mockPassword);

    // Assert
    expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockEmail,
      }),
    );
  });
});
