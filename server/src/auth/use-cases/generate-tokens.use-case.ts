import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class GenerateTokensUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(payload: TokenPayloadDto): Promise<TokensResponse> {
    // Create access token
    const accessToken = this.jwtService.sign(
      { email: payload.email, sub: payload.userId },
      { expiresIn: '15m' },
    );

    // Create refresh token
    const refreshToken = uuidv4();
    const expiresAt = add(new Date(), { months: 1 });

    // Save refresh token to database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
