import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export interface LogoutResponse {
  success: boolean;
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(refreshTokenDto: RefreshTokenDto): Promise<LogoutResponse> {
    try {
      await this.prisma.refreshToken.delete({
        where: { token: refreshTokenDto.refreshToken },
      });
      return { success: true };
    } catch {
      throw new NotFoundException('Refresh token not found');
    }
  }
}
