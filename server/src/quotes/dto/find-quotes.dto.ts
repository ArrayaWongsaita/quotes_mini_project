import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortBy {
  CREATED_AT = 'createdAt',
  UP_VOTE_COUNT = 'upVoteCount',
  DOWN_VOTE_COUNT = 'downVoteCount',
}

export class FindQuotesDto {
  @ApiProperty({ required: false, default: 1, description: 'หน้าที่ต้องการ' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'จำนวนรายการต่อหน้า',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({
    required: false,
    description: 'คำค้นหา (ค้นหาในเนื้อหาและชื่อผู้แต่ง)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    required: false,
    enum: SortBy,
    default: SortBy.CREATED_AT,
    description: 'เรียงตาม',
  })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy: SortBy = SortBy.CREATED_AT;

  @ApiProperty({
    required: false,
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'ลำดับการเรียง',
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;

  @ApiProperty({ required: false, description: 'กรองตามแท็ก (ชื่อแท็ก)' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ required: false, description: 'กรองตามชื่อผู้แต่ง' })
  @IsString()
  @IsOptional()
  author?: string;

  userId: string;

  // แปลง page และ limit เป็น skip สำหรับใช้กับ Prisma
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
