import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeleteQuoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    id: string,
    currentUserId: string,
  ): Promise<{ success: boolean }> {
    // ตรวจสอบว่าคำคมนี้มีอยู่จริงหรือไม่
    const quote = await this.prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException(`ไม่พบคำคมที่มี ID: ${id}`);
    }

    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของคำคมนี้หรือไม่
    if (quote.userId !== currentUserId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบคำคมนี้');
    }

    // ลบคำคม
    await this.prisma.quote.delete({
      where: { id },
    });

    return { success: true };
  }
}
