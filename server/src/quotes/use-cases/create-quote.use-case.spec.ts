/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateQuoteUseCase } from './create-quote.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { QuoteWithTags } from '../types/quote.types';
import { faker } from '@faker-js/faker/locale/th';

describe('CreateQuoteUseCase', () => {
  let useCase: CreateQuoteUseCase;
  let prismaService: PrismaService;

  // Mock data with faker - ส่วนของ Arrange ทั่วไป
  const mockUserId = faker.string.uuid();
  const mockQuoteId = faker.string.uuid();

  const mockCreateQuoteDto: CreateQuoteDto = {
    content: faker.lorem.sentence(),
    author: faker.person.fullName(),
    tags: ['ปรัชญา', 'แรงบันดาลใจ'],
  };

  const mockCreatedQuote = {
    id: mockQuoteId,
    content: mockCreateQuoteDto.content,
    author: mockCreateQuoteDto.author,
    upVoteCount: 0,
    downVoteCount: 0,
    userId: mockUserId,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    tags: [
      { id: faker.string.uuid(), name: mockCreateQuoteDto.tags?.[0] || '' },
      { id: faker.string.uuid(), name: mockCreateQuoteDto.tags?.[1] || '' },
    ],
  };

  // สร้าง mock สำหรับ PrismaService
  const mockPrisma = {
    quote: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateQuoteUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<CreateQuoteUseCase>(CreateQuoteUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a quote with tags successfully', async () => {
    // Arrange
    mockPrisma.quote.create.mockResolvedValue(mockCreatedQuote);

    // Act
    const result = await useCase.execute(
      mockCreateQuoteDto,
      mockUserId as string,
    );

    // Assert
    expect(result).toEqual(mockCreatedQuote);
    expect(mockPrisma.quote.create).toHaveBeenCalledWith({
      data: {
        content: mockCreateQuoteDto.content,
        author: mockCreateQuoteDto.author,
        userId: mockUserId,
        tags: {
          connectOrCreate: [
            {
              where: { name: 'ปรัชญา' },
              create: { name: 'ปรัชญา' },
            },
            {
              where: { name: 'แรงบันดาลใจ' },
              create: { name: 'แรงบันดาลใจ' },
            },
          ],
        },
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });

  it('should create a quote without tags', async () => {
    // Arrange
    const dtoWithoutTags = {
      content: faker.lorem.paragraph(),
      author: faker.person.fullName(),
    };

    const quoteWithoutTags = {
      ...mockCreatedQuote,
      content: dtoWithoutTags.content,
      author: dtoWithoutTags.author,
      tags: [],
    };

    mockPrisma.quote.create.mockResolvedValue(quoteWithoutTags);

    // Act
    const result = await useCase.execute(dtoWithoutTags, mockUserId as string);

    // Assert
    expect(result).toEqual(quoteWithoutTags);
    expect(mockPrisma.quote.create).toHaveBeenCalledWith({
      data: {
        content: dtoWithoutTags.content,
        author: dtoWithoutTags.author,
        userId: mockUserId,
        tags: {
          connectOrCreate: [],
        },
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });

  it('should create a quote with author field as null when not provided', async () => {
    // Arrange
    const dtoWithoutAuthor = {
      content: faker.lorem.paragraph(),
    };

    const quoteWithoutAuthor = {
      ...mockCreatedQuote,
      content: dtoWithoutAuthor.content,
      author: null,
      tags: [],
    };

    mockPrisma.quote.create.mockResolvedValue(quoteWithoutAuthor);

    // Act
    const result = await useCase.execute(
      dtoWithoutAuthor,
      mockUserId as string,
    );

    // Assert
    expect(result.author).toBeNull();
    expect(mockPrisma.quote.create).toHaveBeenCalledWith({
      data: {
        content: dtoWithoutAuthor.content,
        userId: mockUserId,
        tags: {
          connectOrCreate: [],
        },
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
});
