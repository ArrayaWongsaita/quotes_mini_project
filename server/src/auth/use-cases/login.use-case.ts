import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { ValidateUserUseCase } from './validate-user.use-case';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { AuthResponse } from '../models/auth-response.model';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly generateTokensUseCase: GenerateTokensUseCase,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUserUseCase.execute(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload = new TokenPayloadDto();
    tokenPayload.userId = user.id;
    tokenPayload.email = user.email;

    const tokens = await this.generateTokensUseCase.execute(tokenPayload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
