import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVoteDto } from '../dto/create-vote.dto';
import { VoteResult } from '../types/vote.types';

@Injectable()
export class CreateVoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    createVoteDto: CreateVoteDto,
    userId: string,
  ): Promise<VoteResult> {
    const { quoteId, value } = createVoteDto;

    // ตรวจสอบว่าคำคมนี้มีอยู่จริงหรือไม่
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException(`ไม่พบคำคมที่มี ID: ${quoteId}`);
    }

    // ค้นหาโหวตเดิม (ถ้ามี)
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        quoteId_userId: {
          quoteId,
          userId,
        },
      },
    });

    // ทำ transaction เพื่อจัดการโหวตและอัปเดตจำนวนโหวตของคำคม
    return await this.prisma.$transaction(async (prisma) => {
      let newUpVoteCount = quote.upVoteCount;
      let newDownVoteCount = quote.downVoteCount;
      let resultValue: number | null = value;

      // กรณีที่มีการโหวตอยู่แล้ว
      if (existingVote) {
        // ลดจำนวนโหวตเดิม
        if (existingVote.value === 1) {
          newUpVoteCount--;
        } else if (existingVote.value === -1) {
          newDownVoteCount--;
        }

        // ถ้าต้องการยกเลิกโหวต
        if (value === 0) {
          await prisma.vote.delete({
            where: { id: existingVote.id },
          });
          resultValue = null;
        } else {
          // อัปเดตโหวตใหม่
          await prisma.vote.update({
            where: { id: existingVote.id },
            data: { value },
          });
        }
      }
      // กรณีที่ไม่มีโหวตเดิม และไม่ใช่การยกเลิกโหวต
      else if (value !== 0) {
        await prisma.vote.create({
          data: {
            quoteId,
            userId,
            value,
          },
        });
      }
      // กรณีที่ไม่มีโหวตเดิมและต้องการยกเลิกโหวต (ไม่ต้องทำอะไร)
      else {
        resultValue = null;
      }

      // เพิ่มจำนวนโหวตใหม่
      if (value === 1) {
        newUpVoteCount++;
      } else if (value === -1) {
        newDownVoteCount++;
      }

      // อัปเดตจำนวนโหวตของคำคม
      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          upVoteCount: newUpVoteCount,
          downVoteCount: newDownVoteCount,
        },
      });

      return {
        success: true,
        message: this.getSuccessMessage(value, existingVote?.value),
        quoteId,
        value: resultValue,
        upVoteCount: newUpVoteCount,
        downVoteCount: newDownVoteCount,
      };
    });
  }

  // สร้างข้อความสำเร็จตามสถานการณ์
  private getSuccessMessage(newValue: number, oldValue?: number): string {
    if (newValue === 0) {
      return 'ยกเลิกโหวตสำเร็จ';
    }

    if (oldValue === undefined) {
      return newValue === 1 ? 'โหวตบวกสำเร็จ' : 'โหวตลบสำเร็จ';
    }

    if (oldValue === newValue) {
      return 'ไม่มีการเปลี่ยนแปลงโหวต';
    }

    return `เปลี่ยนโหวตจาก ${oldValue === 1 ? 'บวก' : 'ลบ'} เป็น ${newValue === 1 ? 'บวก' : 'ลบ'} สำเร็จ`;
  }
}
