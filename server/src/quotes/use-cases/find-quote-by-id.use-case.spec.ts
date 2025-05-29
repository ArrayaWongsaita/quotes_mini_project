/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { FindQuoteByIdUseCase } from './find-quote-by-id.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker/locale/th';

describe('FindQuoteByIdUseCase', () => {
  let useCase: FindQuoteByIdUseCase;
  let prismaService: PrismaService;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockQuoteId = faker.string.uuid();
  const mockTagId1 = faker.string.uuid();
  const mockTagId2 = faker.string.uuid();

  const mockQuote = {
    id: mockQuoteId,
    content: 'ความสำเร็จไม่ใช่จุดหมายปลายทาง แต่เป็นการเดินทาง',
    author: 'นักปรัชญา',
    upVoteCount: 10,
    downVoteCount: 2,
    userId: mockUserId,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    tags: [
      { id: mockTagId1, name: 'ปรัชญา' },
      { id: mockTagId2, name: 'แรงบันดาลใจ' },
    ],
    user: {
      id: mockUserId,
      name: 'TestUser',
      email: 'testuser@example.com',
    },
    votes: [{ value: 1 }],
  };

  // สร้าง mock สำหรับ PrismaService
  const mockPrisma = {
    quote: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindQuoteByIdUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<FindQuoteByIdUseCase>(FindQuoteByIdUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find a quote by ID successfully', async () => {
    // Arrange
    const quoteWithoutVotes = { ...mockQuote, votes: [] };
    mockPrisma.quote.findUnique.mockResolvedValue(quoteWithoutVotes);

    // Act
    const result = await useCase.execute(mockQuoteId);

    // Assert
    expect(result).toEqual({
      id: mockQuote.id,
      content: mockQuote.content,
      author: mockQuote.author,
      upVoteCount: mockQuote.upVoteCount,
      downVoteCount: mockQuote.downVoteCount,
      userId: mockQuote.userId,
      createdAt: mockQuote.createdAt,
      updatedAt: mockQuote.updatedAt,
      tags: [
        { id: mockTagId1, name: 'ปรัชญา' },
        { id: mockTagId2, name: 'แรงบันดาลใจ' },
      ],
      user: {
        id: mockUserId,
        name: 'TestUser',
        email: 'testuser@example.com',
      },
      userVote: null,
    });

    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: false,
      },
    });
  });

  it('should find a quote with user vote when currentUserId is provided', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    const currentUserId = mockUserId;

    // Act
    const result = await useCase.execute(mockQuoteId, currentUserId);

    // Assert
    expect(result.userVote).toBe(1);
    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: {
          where: {
            userId: currentUserId,
          },
          select: {
            value: true,
          },
          take: 1,
        },
      },
    });
  });

  it('should return null for userVote when user has not voted', async () => {
    // Arrange
    const quoteWithEmptyVotes = { ...mockQuote, votes: [] };
    mockPrisma.quote.findUnique.mockResolvedValue(quoteWithEmptyVotes);
    const currentUserId = 'different-user-id';

    // Act
    const result = await useCase.execute(mockQuoteId, currentUserId);

    // Assert
    expect(result.userVote).toBeNull();
  });

  it('should throw NotFoundException when quote does not exist', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );

    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
      include: expect.any(Object),
    });
  });
});
