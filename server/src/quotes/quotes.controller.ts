import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { QuoteResponse } from './models/quote-response.model';
import { FindQuotesDto } from './dto/find-quotes.dto';
import { FindQuotesUseCase } from './use-cases/find-quotes.use-case';
import { PaginatedQuotesResponse } from './models/paginated-quotes-response.model';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateQuoteUseCase } from './use-cases/update-quote.use-case';
import { DeleteQuoteUseCase } from './use-cases/delete-quote.use-case';

@ApiTags('quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuoteUseCase: CreateQuoteUseCase,
    private readonly findQuotesUseCase: FindQuotesUseCase,
    private readonly updateQuoteUseCase: UpdateQuoteUseCase,
    private readonly deleteQuoteUseCase: DeleteQuoteUseCase,
  ) {}

  @ApiOperation({ summary: 'สร้างคำคมใหม่' })
  @ApiResponse({
    status: 201,
    description: 'คำคมถูกสร้างเรียบร้อย',
    type: QuoteResponse,
  })
  @ApiUnauthorizedResponse({ description: 'ไม่ได้รับอนุญาต' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createQuoteDto: CreateQuoteDto,
    @Request() req,
  ): Promise<QuoteResponse> {
    const userId = req.user.id;
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }
    return await this.createQuoteUseCase.execute(createQuoteDto, userId);
  }

  @ApiOperation({ summary: 'ค้นหาคำคมตามเงื่อนไข' })
  @ApiResponse({
    status: 200,
    description: 'รายการคำคมตามเงื่อนไขการค้นหา',
    type: PaginatedQuotesResponse,
  })
  @ApiUnauthorizedResponse({ description: 'ไม่ได้รับอนุญาต' })
  @ApiBearerAuth() // เพิ่ม ApiBearerAuth เพื่อให้ Swagger แสดงปุ่มส่ง token
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query() findQuotesDto: FindQuotesDto,
    @Request() req,
  ): Promise<PaginatedQuotesResponse> {
    const currentUserId = req.user?.id as string | undefined;
    if (currentUserId && typeof currentUserId !== 'string') {
      throw new Error('Current user ID must be a string');
    }

    // ส่ง userId ไปยัง use case และส่งผลลัพธ์กลับโดยตรง
    return await this.findQuotesUseCase.execute(findQuotesDto, currentUserId);
  }

  @ApiOperation({ summary: 'อัปเดตคำคม' })
  @ApiResponse({
    status: 200,
    description: 'คำคมถูกอัปเดตเรียบร้อย',
    type: QuoteResponse,
  })
  @ApiUnauthorizedResponse({ description: 'ไม่ได้รับอนุญาต' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @Request() req,
  ): Promise<QuoteResponse> {
    const userId = req.user.id;
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }

    return await this.updateQuoteUseCase.execute(id, updateQuoteDto, userId);
  }

  @ApiOperation({ summary: 'ลบคำคม' })
  @ApiResponse({
    status: 204,
    description: 'ลบคำคมสำเร็จ',
  })
  @ApiUnauthorizedResponse({ description: 'ไม่ได้รับอนุญาต' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }

    await this.deleteQuoteUseCase.execute(id, userId);
  }
}
