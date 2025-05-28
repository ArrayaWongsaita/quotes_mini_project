import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FindUserByIdDto } from '../dto/find-user-by-id.dto';
import { IUser } from '../interfaces/user.interface';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(findUserByIdDto: FindUserByIdDto): Promise<IUser> {
    const { id } = findUserByIdDto;

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as IUser;
  }
}
