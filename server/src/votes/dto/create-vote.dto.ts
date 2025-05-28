import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({
    description: 'รหัสคำคมที่ต้องการโหวต',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  quoteId: string;

  @ApiProperty({
    description: 'ค่าของโหวต: 1 (โหวตบวก), -1 (โหวตลบ), 0 (ยกเลิกโหวต)',
    example: 1,
    enum: [1, -1, 0],
  })
  @IsNotEmpty()
  @IsIn([1, -1, 0], { message: 'ค่าของโหวตต้องเป็น 1, -1 หรือ 0 เท่านั้น' })
  value: number;
}
