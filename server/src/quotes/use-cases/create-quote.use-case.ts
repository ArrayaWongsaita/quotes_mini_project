import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { QuoteWithTags } from '../types/quote.types';

// Define the return type for better type safety

@Injectable()
export class CreateQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    createQuoteDto: CreateQuoteDto,
    userId: string,
  ): Promise<QuoteWithTags> {
    const { tags, ...quote } = createQuoteDto;

    // สร้างคำคมใหม่โดยไม่ต้องใช้ transaction
    const result = await this.prisma.quote.create({
      data: {
        ...quote,
        userId,
        tags: {
          connectOrCreate:
            tags?.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })) || [],
        },
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        }, // Include all tags
      },
    });

    // Type assertion to satisfy TypeScript
    return result as QuoteWithTags;
  }
}
