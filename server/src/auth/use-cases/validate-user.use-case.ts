import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailUseCase } from '../../users/use-cases/find-user-by-email.use-case';
import { FindUserByEmailDto } from '../../users/dto/find-user-by-email.dto';
import { IUserWithoutPassword } from '../../users/interfaces/user.interface';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
  ) {}

  async execute(
    email: string,
    password: string,
  ): Promise<IUserWithoutPassword | null> {
    const dto = new FindUserByEmailDto();
    dto.email = email;

    const user = await this.findUserByEmailUseCase.execute(dto);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
