import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VotesController } from './votes.controller';
import { CreateVoteUseCase } from './use-cases/create-vote.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [VotesController],
  providers: [CreateVoteUseCase],
  exports: [CreateVoteUseCase],
})
export class VotesModule {}
