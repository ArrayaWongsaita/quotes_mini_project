import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { AuthResponse } from '../models/auth-response.model';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateTokensUseCase: GenerateTokensUseCase,
  ) {}

  async execute(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    // Find refresh token in database
    const refreshTokenData = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!refreshTokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenData.expiresAt < new Date()) {
      // Remove expired token
      await this.prisma.refreshToken.delete({
        where: { id: refreshTokenData.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Delete the old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: refreshTokenData.id },
    });

    // Generate new tokens
    const tokenPayload = new TokenPayloadDto();
    tokenPayload.userId = refreshTokenData.user.id;
    tokenPayload.email = refreshTokenData.user.email;

    const tokens = await this.generateTokensUseCase.execute(tokenPayload);

    return {
      ...tokens,
      user: {
        id: refreshTokenData.user.id,
        email: refreshTokenData.user.email,
        name: refreshTokenData.user.name,
      },
    };
  }
}
