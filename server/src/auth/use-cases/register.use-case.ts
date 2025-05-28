import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailUseCase } from '../../users/use-cases/find-user-by-email.use-case';
import { CreateUserUseCase } from '../../users/use-cases/create-user.use-case';
import {
  GenerateTokensUseCase,
  TokenPayloadDto,
} from './generate-tokens.use-case';
import { AuthResponse } from '../models/auth-response.model';
import { FindUserByEmailDto } from '../../users/dto/find-user-by-email.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly generateTokensUseCase: GenerateTokensUseCase,
  ) {}

  async execute(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const emailDto = new FindUserByEmailDto();
    emailDto.email = registerDto.email;

    const existingUser = await this.findUserByEmailUseCase.execute(emailDto);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Create new user
    const createUserDto = new CreateUserDto();
    createUserDto.email = registerDto.email;
    createUserDto.name = registerDto.name;
    createUserDto.password = await bcrypt.hash(registerDto.password, 10);

    const user = await this.createUserUseCase.execute(createUserDto);

    // Generate tokens
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
