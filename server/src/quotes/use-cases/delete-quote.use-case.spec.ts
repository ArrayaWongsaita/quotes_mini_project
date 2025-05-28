/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteQuoteUseCase } from './delete-quote.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { faker } from '@faker-js/faker/locale/th';

describe('DeleteQuoteUseCase', () => {
  let useCase: DeleteQuoteUseCase;
  let prismaService: PrismaService;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockQuoteId = faker.string.uuid();
  const mockDifferentUserId = faker.string.uuid();

  const mockQuote = {
    id: mockQuoteId,
    content: faker.lorem.sentence(),
    author: faker.person.fullName(),
    upVoteCount: 0,
    downVoteCount: 0,
    userId: mockUserId,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  // สร้าง mock สำหรับ PrismaService
  const mockPrisma = {
    quote: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteQuoteUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<DeleteQuoteUseCase>(DeleteQuoteUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete a quote successfully when the user is the owner', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.quote.delete.mockResolvedValue({ ...mockQuote });

    // Act
    const result = await useCase.execute(mockQuoteId, mockUserId);

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
    });
    expect(mockPrisma.quote.delete).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
    });
  });

  it('should throw NotFoundException when quote does not exist', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute('non-existent-id', mockUserId),
    ).rejects.toThrow(NotFoundException);
    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
    expect(mockPrisma.quote.delete).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the quote owner', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);

    // Act & Assert
    await expect(
      useCase.execute(mockQuoteId, mockDifferentUserId),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
    });
    expect(mockPrisma.quote.delete).not.toHaveBeenCalled();
  });
});
