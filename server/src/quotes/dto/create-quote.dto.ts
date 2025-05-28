import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'เนื้อหาของคำคม',
    example: 'การเดินทางพันไมล์ เริ่มต้นด้วยก้าวเดียว',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ชื่อผู้แต่งหรือผู้พูดคำคม',
    example: 'เล่าจื๊อ',
    required: false,
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description: 'รายการแท็กที่เกี่ยวข้องกับคำคมนี้',
    example: ['แรงบันดาลใจ', 'ปรัชญา'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  tags?: string[];
}
