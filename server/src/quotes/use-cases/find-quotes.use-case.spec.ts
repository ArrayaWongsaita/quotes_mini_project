/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { FindQuotesUseCase } from './find-quotes.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { FindQuotesDto } from '../dto/find-quotes.dto';
import { faker } from '@faker-js/faker/locale/th';
import { SortOrder, SortBy } from '../dto/find-quotes.dto';

describe('FindQuotesUseCase', () => {
  let useCase: FindQuotesUseCase;
  let prismaService: PrismaService;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockQuoteId1 = faker.string.uuid();
  const mockQuoteId2 = faker.string.uuid();
  const mockTagId1 = faker.string.uuid();
  const mockTagId2 = faker.string.uuid();

  // สร้าง mock quotes
  const mockQuotes = [
    {
      id: mockQuoteId1,
      content: 'ความสำเร็จไม่ใช่จุดหมายปลายทาง แต่เป็นการเดินทาง',
      author: 'นักปรัชญา',
      upVoteCount: 10,
      downVoteCount: 2,
      userId: mockUserId,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
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
    },
    {
      id: mockQuoteId2,
      content: 'การเรียนรู้คือการเดินทางที่ไม่มีวันสิ้นสุด',
      author: 'นักการศึกษา',
      upVoteCount: 5,
      downVoteCount: 1,
      userId: faker.string.uuid(),
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      tags: [{ id: mockTagId2, name: 'แรงบันดาลใจ' }],
      user: {
        id: faker.string.uuid(),
        name: 'AnotherUser',
        email: 'anotheruser@example.com',
      },
      votes: [],
    },
  ];

  // สร้าง mock สำหรับ PrismaService
  const mockPrisma = {
    quote: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindQuotesUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<FindQuotesUseCase>(FindQuotesUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
    mockPrisma.quote.count.mockResolvedValue(2);
    mockPrisma.quote.findMany.mockResolvedValue(mockQuotes);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find quotes with default parameters', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      userId: mockUserId,
    };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.data.length).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalItems).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);

    // Check correct query parameters
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      where: {
        userId: mockUserId, // Updated to include userId in where clause
      },
      orderBy: { createdAt: 'desc' },
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

  it('should find quotes with search parameter', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      search: 'เรียนรู้',
      userId: mockUserId,
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { content: { contains: 'เรียนรู้', mode: 'insensitive' } },
            { author: { contains: 'เรียนรู้', mode: 'insensitive' } },
          ],
          userId: mockUserId, // Updated to include userId in where clause
        },
      }),
    );
  });

  it('should find quotes by author', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      author: 'นักปรัชญา',
      userId: mockUserId,
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          author: { contains: 'นักปรัชญา', mode: 'insensitive' },
          userId: mockUserId, // Updated to include userId in where clause
        },
      }),
    );
  });

  it('should find quotes by userId', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      userId: mockUserId,
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: mockUserId,
        },
      }),
    );
  });

  it('should find quotes by tag', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      tag: 'ปรัชญา',
      userId: mockUserId,
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tags: {
            some: {
              name: { equals: 'ปรัชญา', mode: 'insensitive' },
            },
          },
          userId: mockUserId, // Updated to include userId in where clause
        },
      }),
    );
  });

  it('should sort by specified field and order', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.UP_VOTE_COUNT,
      sortOrder: 'asc' as SortOrder,
      userId: mockUserId,
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { upVoteCount: 'asc' },
      }),
    );
  });

  it('should apply pagination correctly', async () => {
    // Arrange
    mockPrisma.quote.count.mockResolvedValue(25);
    const dto: FindQuotesDto = {
      page: 2,
      limit: 10,
      skip: 10,
      sortBy: SortBy.CREATED_AT,
      sortOrder: 'desc' as SortOrder,
      userId: mockUserId,
    };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.page).toBe(2);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(true);
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it('should include user vote when currentUserId is provided', async () => {
    // Arrange
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: SortOrder.DESC,
      userId: mockUserId,
    };

    // Act
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          votes: {
            where: {
              userId: mockUserId,
            },
            select: {
              value: true,
            },
            take: 1,
          },
        }),
      }),
    );
    // First quote should have userVote = 1
    expect(result.data[0].userVote).toBe(1);
    // Second quote should have userVote = null
    expect(result.data[1].userVote).toBeNull();
  });

  it('should handle empty result set', async () => {
    // Arrange
    mockPrisma.quote.count.mockResolvedValue(0);
    mockPrisma.quote.findMany.mockResolvedValue([]);
    const dto: FindQuotesDto = {
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: SortBy.CREATED_AT,
      sortOrder: SortOrder.DESC,
      userId: mockUserId,
    };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });
});
