/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateQuoteUseCase } from './update-quote.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { faker } from '@faker-js/faker/locale/th';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UpdateQuoteUseCase', () => {
  let useCase: UpdateQuoteUseCase;
  let prismaService: PrismaService;

  // Mock data
  const mockUserId = faker.string.uuid();
  const mockQuoteId = faker.string.uuid();
  const mockDifferentUserId = faker.string.uuid();
  const mockTagId1 = faker.string.uuid();
  const mockTagId2 = faker.string.uuid();
  const mockTagId3 = faker.string.uuid();

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
  };

  // สร้าง mock สำหรับ PrismaService
  const mockPrisma = {
    quote: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateQuoteUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<UpdateQuoteUseCase>(UpdateQuoteUseCase);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mock data between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update a quote successfully when the user is the owner', async () => {
    // Arrange
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
      author: 'นักเขียน',
      tags: ['ความสำเร็จ', 'ความพยายาม'],
    };

    const updatedQuote = {
      ...mockQuote,
      content: updateQuoteDto.content,
      author: updateQuoteDto.author,
      tags: [
        { id: mockTagId2, name: 'ความสำเร็จ' },
        { id: mockTagId3, name: 'ความพยายาม' },
      ],
      updatedAt: faker.date.recent(),
    };

    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.quote.update.mockResolvedValue(updatedQuote);

    // Act
    const result = await useCase.execute(
      mockQuoteId,
      updateQuoteDto,
      mockUserId,
    );

    // Assert
    expect(result).toEqual({
      id: mockQuoteId,
      content: updateQuoteDto.content,
      author: updateQuoteDto.author,
      upVoteCount: mockQuote.upVoteCount,
      downVoteCount: mockQuote.downVoteCount,
      userId: mockUserId,
      createdAt: mockQuote.createdAt,
      updatedAt: updatedQuote.updatedAt,
      tags: [
        { id: mockTagId2, name: 'ความสำเร็จ' },
        { id: mockTagId3, name: 'ความพยายาม' },
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
      include: { tags: true },
    });

    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        content: updateQuoteDto.content,
        author: updateQuoteDto.author,
        tags: {
          deleteMany: {},
          connectOrCreate: [
            {
              where: { name: 'ความสำเร็จ' },
              create: { name: 'ความสำเร็จ' },
            },
            {
              where: { name: 'ความพยายาม' },
              create: { name: 'ความพยายาม' },
            },
          ],
        },
      },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  it('should update a quote without tags', async () => {
    // Arrange
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
      author: 'นักเขียน',
    };

    const updatedQuote = {
      ...mockQuote,
      content: updateQuoteDto.content,
      author: updateQuoteDto.author,
      updatedAt: faker.date.recent(),
    };

    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.quote.update.mockResolvedValue(updatedQuote);

    // Act
    const result = await useCase.execute(
      mockQuoteId,
      updateQuoteDto,
      mockUserId,
    );

    // Assert
    expect(result.content).toBe(updateQuoteDto.content);
    expect(result.author).toBe(updateQuoteDto.author);
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        content: updateQuoteDto.content,
        author: updateQuoteDto.author,
      },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  it('should throw NotFoundException when quote does not exist', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(null);
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
    };

    // Act & Assert
    await expect(
      useCase.execute('non-existent-id', updateQuoteDto, mockUserId),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
      include: { tags: true },
    });
    expect(mockPrisma.quote.update).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the quote owner', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
    };

    // Act & Assert
    await expect(
      useCase.execute(mockQuoteId, updateQuoteDto, mockDifferentUserId),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      include: { tags: true },
    });
    expect(mockPrisma.quote.update).not.toHaveBeenCalled();
  });

  it('should update only specified fields', async () => {
    // Arrange
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
      // author is not included
    };

    const updatedQuote = {
      ...mockQuote,
      content: updateQuoteDto.content,
      // author remains unchanged
      updatedAt: faker.date.recent(),
    };

    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.quote.update.mockResolvedValue(updatedQuote);

    // Act
    const result = await useCase.execute(
      mockQuoteId,
      updateQuoteDto,
      mockUserId,
    );

    // Assert
    expect(result.content).toBe(updateQuoteDto.content);
    expect(result.author).toBe(mockQuote.author); // author remains unchanged
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        content: updateQuoteDto.content,
      },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  it('should handle empty tags array', async () => {
    // Arrange
    const updateQuoteDto: UpdateQuoteDto = {
      content: 'ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น',
      tags: [], // empty tags array
    };

    const updatedQuote = {
      ...mockQuote,
      content: updateQuoteDto.content,
      tags: [],
      updatedAt: faker.date.recent(),
    };

    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.quote.update.mockResolvedValue(updatedQuote);

    // Act
    const result = await useCase.execute(
      mockQuoteId,
      updateQuoteDto,
      mockUserId,
    );

    // Assert
    expect(result.tags).toEqual([]);
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        content: updateQuoteDto.content,
        tags: {
          deleteMany: {},
          connectOrCreate: [],
        },
      },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });
});
