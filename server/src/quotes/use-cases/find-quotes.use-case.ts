import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FindQuotesDto } from '../dto/find-quotes.dto';
import { Prisma } from '../../../generated/prisma';
import {
  QuoteWithRelations,
  QuoteWithUserVote,
  PaginatedQuotesResult,
} from '../types/quote.types';

@Injectable()
export class FindQuotesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    dto: FindQuotesDto,
    currentUserId?: string,
  ): Promise<PaginatedQuotesResult> {
    // สร้างเงื่อนไขสำหรับการค้นหา
    const where: Prisma.QuoteWhereInput = {};

    // ถ้ามีการระบุคำค้นหา
    if (dto.search) {
      where.OR = [
        { content: { contains: dto.search, mode: 'insensitive' } },
        { author: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // กรองตาม author
    if (dto.author) {
      where.author = { contains: dto.author, mode: 'insensitive' };
    }

    // กรองตาม userId
    where.userId = dto.userId;

    // กรองตามแท็ก
    if (dto.tag) {
      where.tags = {
        some: {
          name: { equals: dto.tag, mode: 'insensitive' },
        },
      };
    }

    // สร้างการเรียงลำดับ
    const orderBy: Prisma.QuoteOrderByWithRelationInput = {
      [dto.sortBy]: dto.sortOrder.toLowerCase(),
    };

    // ต้องแน่ใจว่า skip และ limit เป็นตัวเลข
    // กำหนดค่าเริ่มต้นสำหรับ skip กรณีที่ dto.skip เป็น undefined
    const take = Number(dto.limit) || 10;
    const skip = typeof dto.skip === 'number' ? Number(dto.skip) : 0;

    // คำนวณจำนวนรายการทั้งหมด
    const totalItems = await this.prisma.quote.count({ where });
    const totalPages = Math.ceil(totalItems / take);

    // ดึงข้อมูล quotes ตามเงื่อนไข และระบุ skip อย่างชัดเจน
    const quotes = (await this.prisma.quote.findMany({
      skip: skip, // ระบุ skip ชัดเจนและไม่ใช้ shorthand syntax
      take,
      where,
      orderBy,
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // เพิ่มการดึงข้อมูลการโหวตของผู้ใช้ปัจจุบัน (ถ้ามี)
        votes: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
              select: {
                value: true,
              },
              take: 1,
            }
          : false,
      },
    })) as unknown as QuoteWithRelations[];

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const formattedQuotes: QuoteWithUserVote[] = quotes.map((quote) => {
      // หาข้อมูลการโหวตของผู้ใช้ปัจจุบัน (ถ้ามี)
      const userVote =
        currentUserId && quote.votes && quote.votes.length > 0
          ? quote.votes[0].value
          : null;

      // สร้าง object ใหม่ที่ไม่รวมข้อมูลการโหวตดิบ
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { votes, ...quoteData } = quote;

      return {
        ...quoteData,
        tags: quoteData.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })),
        user: {
          id: quoteData.user.id,
          name: quoteData.user.name,
          email: quoteData.user.email,
        },
        // เพิ่มข้อมูลการโหวตของผู้ใช้ปัจจุบัน
        userVote,
      };
    });

    return {
      data: formattedQuotes,
      page: Number(dto.page),
      limit: take,
      totalItems,
      totalPages,
      hasNextPage: Number(dto.page) < totalPages,
      hasPreviousPage: Number(dto.page) > 1,
    };
  }
}
