/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { FindUserByIdUseCase } from '../../users/use-cases/find-user-by-id.use-case';
import { IUser } from '../../users/interfaces/user.interface';
import { faker } from '@faker-js/faker/locale/th';
import { FindUserByIdDto } from '../../users/dto/find-user-by-id.dto';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let findUserByIdUseCase: FindUserByIdUseCase;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockUser: IUser = {
    id: mockUserId,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'hashed_password', // This should be excluded from the response
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  // Mock for FindUserByIdUseCase
  const mockFindUserByIdUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        {
          provide: FindUserByIdUseCase,
          useValue: mockFindUserByIdUseCase,
        },
      ],
    }).compile();

    useCase = module.get<GetProfileUseCase>(GetProfileUseCase);
    findUserByIdUseCase = module.get<FindUserByIdUseCase>(FindUserByIdUseCase);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return user profile without password', async () => {
    // Arrange
    mockFindUserByIdUseCase.execute.mockResolvedValue(mockUser);

    // Act
    const result = await useCase.execute(mockUserId);

    // Assert
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    });
    // Check that password is not included in the result object
    expect('password' in result).toBe(false);

    // Verify FindUserByIdUseCase was called with correct DTO
    const expectedDto = new FindUserByIdDto();
    expectedDto.id = mockUserId;

    expect(mockFindUserByIdUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUserId,
      }),
    );
  });

  it('should throw NotFoundException when user is not found', async () => {
    // Arrange
    mockFindUserByIdUseCase.execute.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(mockUserId)).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute(mockUserId)).rejects.toThrow(
      `User with ID ${mockUserId} not found`,
    );

    expect(mockFindUserByIdUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUserId,
      }),
    );
  });

  it('should handle user with additional fields', async () => {
    // Arrange
    const userWithExtraFields = {
      ...mockUser,
      role: 'user',
      lastLogin: faker.date.recent(),
    };
    mockFindUserByIdUseCase.execute.mockResolvedValue(userWithExtraFields);

    // Act
    const result = await useCase.execute(mockUserId);

    // Assert
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
      role: 'user',
      lastLogin: expect.any(Date),
    });
    // Check that password is not included in the result object
    expect('password' in result).toBe(false);
  });
});
