import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { QuoteWithUserVote } from '../types/quote.types';

@Injectable()
export class UpdateQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    currentUserId: string,
  ): Promise<QuoteWithUserVote> {
    // ตรวจสอบว่า quote นี้มีอยู่จริงหรือไม่
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!quote) {
      throw new NotFoundException(`ไม่พบคำคมที่มี ID: ${id}`);
    }

    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของคำคมนี้หรือไม่
    if (quote.userId !== currentUserId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขคำคมนี้');
    }

    const { tags, ...updateData } = updateQuoteDto;

    // อัปเดตคำคม
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        ...updateData,
        // อัปเดตแท็กถ้ามีการระบุมา
        ...(tags && {
          tags: {
            // ลบแท็กเดิมทั้งหมด
            deleteMany: {},
            // เพิ่มแท็กใหม่ทั้งหมด
            connectOrCreate: tags.map((tagName) => ({
              where: { name: tagName },
              create: { name: tagName },
            })),
          },
        }),
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

    // แปลงข้อมูลให้อยู่ในรูปแบบเดียวกับ QuoteWithUserVote
    const result: QuoteWithUserVote = {
      id: updatedQuote.id,
      content: updatedQuote.content,
      author: updatedQuote.author,
      upVoteCount: updatedQuote.upVoteCount,
      downVoteCount: updatedQuote.downVoteCount,
      userId: updatedQuote.userId,
      createdAt: updatedQuote.createdAt,
      updatedAt: updatedQuote.updatedAt,
      tags: updatedQuote.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
      user: {
        id: updatedQuote.user.id,
        name: updatedQuote.user.name,
        email: updatedQuote.user.email,
      },
      userVote: null, // ไม่มีข้อมูลการโหวต ณ ตอนนี้
    };

    return result;
  }
}
