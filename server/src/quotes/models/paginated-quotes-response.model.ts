import { ApiProperty } from '@nestjs/swagger';
import { QuoteResponse } from './quote-response.model';

export class PaginatedQuotesResponse {
  @ApiProperty({ type: [QuoteResponse] })
  data: QuoteResponse[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}
