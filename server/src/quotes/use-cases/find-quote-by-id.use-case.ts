import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuoteWithUserVote } from '../types/quote.types';

@Injectable()
export class FindQuoteByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    id: string,
    currentUserId?: string,
  ): Promise<QuoteWithUserVote> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    if (!quote) {
      throw new NotFoundException(`ไม่พบคำคมที่มี ID: ${id}`);
    }

    // Find the user's vote if any
    const userVote =
      currentUserId && quote.votes && quote.votes.length > 0
        ? quote.votes[0].value
        : null;

    // Remove votes from the result
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
      userVote,
    };
  }
}
