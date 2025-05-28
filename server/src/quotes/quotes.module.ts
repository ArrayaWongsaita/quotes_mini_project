import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotesController } from './quotes.controller';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { FindQuotesUseCase } from './use-cases/find-quotes.use-case';
import { UpdateQuoteUseCase } from './use-cases/update-quote.use-case';
import { DeleteQuoteUseCase } from './use-cases/delete-quote.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [QuotesController],
  providers: [
    CreateQuoteUseCase,
    FindQuotesUseCase,
    UpdateQuoteUseCase,
    DeleteQuoteUseCase,
  ],
  exports: [
    CreateQuoteUseCase,
    FindQuotesUseCase,
    UpdateQuoteUseCase,
    DeleteQuoteUseCase,
  ],
})
export class QuotesModule {}
