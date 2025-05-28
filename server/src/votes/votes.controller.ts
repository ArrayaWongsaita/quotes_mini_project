import { Body, Controller, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CreateVoteUseCase } from './use-cases/create-vote.use-case';
import { VoteResult } from './types/vote.types';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly createVoteUseCase: CreateVoteUseCase) {}

  @ApiOperation({ summary: 'โหวตหรือเปลี่ยนแปลงโหวตสำหรับคำคม' })
  @ApiResponse({
    status: 200,
    description: 'การโหวตสำเร็จ',
  })
  @ApiUnauthorizedResponse({ description: 'ไม่ได้รับอนุญาต' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put()
  async vote(
    @Body() createVoteDto: CreateVoteDto,
    @Request() req,
  ): Promise<VoteResult> {
    const userId = req.user.id;
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }
    return await this.createVoteUseCase.execute(createVoteDto, userId);
  }
}
