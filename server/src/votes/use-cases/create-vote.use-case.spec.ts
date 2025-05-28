/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateVoteUseCase } from './create-vote.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateVoteDto } from '../dto/create-vote.dto';
import { faker } from '@faker-js/faker/locale/th';

describe('CreateVoteUseCase', () => {
  let useCase: CreateVoteUseCase;
  let prismaService: PrismaService;
  let mockPrisma: any;

  // ตัวแปรที่จะใช้ในแต่ละ test case
  let mockUserId: string;
  let mockQuoteId: string;
  let mockExistingVoteId: string;
  let mockQuote: any;
  let mockExistingVote: any;

  beforeEach(async () => {
    // สร้างข้อมูล mock ใหม่ทุกครั้งที่รัน test case
    mockUserId = faker.string.uuid();
    mockQuoteId = faker.string.uuid();
    mockExistingVoteId = faker.string.uuid();

    mockQuote = {
      id: mockQuoteId,
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
      userId: faker.string.uuid(),
      upVoteCount: 5, // กำหนดค่าเริ่มต้นที่แน่นอนเพื่อให้ทดสอบได้แม่นยำขึ้น
      downVoteCount: 3,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };

    mockExistingVote = {
      id: mockExistingVoteId,
      quoteId: mockQuoteId,
      userId: mockUserId,
      value: 1,
      createdAt: faker.date.recent(),
    };

    // สร้าง mock สำหรับ PrismaService
    mockPrisma = {
      quote: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      vote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation((callback) =>
          Promise.resolve(callback(mockPrisma)),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVoteUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<CreateVoteUseCase>(CreateVoteUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException when quote does not exist', async () => {
    // Setup
    mockPrisma.quote.findUnique.mockResolvedValue(null);

    const dto: CreateVoteDto = { quoteId: 'non-existent-id', value: 1 };

    // Test & Assert
    await expect(useCase.execute(dto, mockUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
  });

  it('should create a new upvote', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({
      id: 'new-vote-id',
      value: 1,
      quoteId: mockQuoteId,
      userId: mockUserId,
    });

    // When a new upvote is created, upVoteCount is increased by 1
    const updatedQuote = {
      ...mockQuote,
      upVoteCount: 6, // Was 5, increased to 6
    };
    mockPrisma.quote.update.mockResolvedValue(updatedQuote);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: 1 };

    // Act
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result).toEqual({
      success: true,
      message: 'โหวตบวกสำเร็จ',
      quoteId: mockQuoteId,
      value: 1,
      upVoteCount: 6, // Match what the implementation returns
      downVoteCount: 3, // Original downVoteCount is unchanged
    });
    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: {
        quoteId: mockQuoteId,
        userId: mockUserId,
        value: 1,
      },
    });
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        upVoteCount: 6,
        downVoteCount: 3,
      },
    });
  });

  it('should create a new downvote', async () => {
    // Arrange
    const specificMockQuote = {
      ...mockQuote,
      upVoteCount: 5, // กำหนดค่าเริ่มต้นที่แน่นอน
      downVoteCount: 3, // กำหนดค่าเริ่มต้นที่แน่นอน
    };

    mockPrisma.quote.findUnique.mockResolvedValue(specificMockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(null);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: -1 };

    // Act
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result.value).toBe(-1);
    expect(result.downVoteCount).toBe(4); // ค่าเริ่มต้น 3 + 1 = 4
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: mockQuoteId },
      data: {
        upVoteCount: 5,
        downVoteCount: 4,
      },
    });
  });

  it('should change vote from upvote to downvote', async () => {
    // Setup
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(mockExistingVote);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: -1 };

    // Test
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result.value).toBe(-1);
    expect(result.upVoteCount).toBe(4); // Decreased by 1
    expect(result.downVoteCount).toBe(4); // Increased by 1
    expect(mockPrisma.vote.update).toHaveBeenCalledWith({
      where: { id: mockExistingVoteId },
      data: { value: -1 },
    });
  });

  it('should remove a vote', async () => {
    // Setup
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(mockExistingVote);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: 0 };

    // Test
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result.value).toBeNull();
    expect(result.upVoteCount).toBe(4); // Decreased by 1 because existing vote was upvote
    expect(result.downVoteCount).toBe(3); // Unchanged
    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: { id: mockExistingVoteId },
    });
  });

  it('should do nothing when trying to remove non-existent vote', async () => {
    // Setup
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(null);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: 0 };

    // Test
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result.value).toBeNull();
    expect(result.upVoteCount).toBe(5); // Unchanged
    expect(result.downVoteCount).toBe(3); // Unchanged
    expect(mockPrisma.vote.delete).not.toHaveBeenCalled();
    expect(mockPrisma.vote.create).not.toHaveBeenCalled();
  });

  it('should handle unchanged vote value', async () => {
    // Arrange
    mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);
    mockPrisma.vote.findUnique.mockResolvedValue(mockExistingVote);

    const dto: CreateVoteDto = { quoteId: mockQuoteId, value: 1 }; // Same as existing vote

    // Act
    const result = await useCase.execute(dto, mockUserId);

    // Assert
    expect(result.message).toBe('ไม่มีการเปลี่ยนแปลงโหวต');
    expect(result.upVoteCount).toBe(5); // ค่าไม่เปลี่ยนแปลงจากค่าเริ่มต้น
    expect(result.downVoteCount).toBe(3); // ค่าไม่เปลี่ยนแปลงจากค่าเริ่มต้น
  });
});
