import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FindUserByEmailUseCase } from './use-cases/find-user-by-email.use-case';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-case';
import { CreateUserUseCase } from './use-cases/create-user.use-case';

@Module({
  imports: [PrismaModule],
  providers: [FindUserByEmailUseCase, FindUserByIdUseCase, CreateUserUseCase],
  exports: [FindUserByEmailUseCase, FindUserByIdUseCase, CreateUserUseCase],
})
export class UsersModule {}
