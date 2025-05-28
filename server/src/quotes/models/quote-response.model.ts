import { ApiProperty } from '@nestjs/swagger';

export class TagResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'แรงบันดาลใจ' })
  name: string;
}

export class QuoteResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'การเดินทางพันไมล์ เริ่มต้นด้วยก้าวเดียว' })
  content: string;

  @ApiProperty({
    example: 'เล่าจื๊อ',
    required: false,
    nullable: true,
  })
  author?: string | null;

  @ApiProperty({ example: 10 })
  upVoteCount: number;

  @ApiProperty({ example: 2 })
  downVoteCount: number;

  @ApiProperty({ type: [TagResponse] })
  tags: TagResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
