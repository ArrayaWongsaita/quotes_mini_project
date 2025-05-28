import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma';
import { CreateUserDto } from '../dto/create-user.dto';
import { IUserWithoutPassword } from '../interfaces/user.interface';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(createUserDto: CreateUserDto): Promise<IUserWithoutPassword> {
    try {
      // Create the user
      const user = await this.prisma.user.create({
        data: createUserDto,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }, // Don't return the password
      });

      return user as IUserWithoutPassword;
    } catch (error) {
      // Handle specific Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 is the error code for unique constraint violation
        if (error.code === 'P2002') {
          throw new ConflictException('A user with this email already exists');
        }
      }
      throw error;
    }
  }
}
