import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FindUserByEmailDto } from '../dto/find-user-by-email.dto';
import { IUser } from '../interfaces/user.interface';

@Injectable()
export class FindUserByEmailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(findUserByEmailDto: FindUserByEmailDto): Promise<IUser | null> {
    const { email } = findUserByEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user as IUser | null;
  }
}
