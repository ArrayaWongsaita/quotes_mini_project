import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-case';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponse } from './models/user-response.model';
import { FindUserByIdDto } from './dto/find-user-by-id.dto';
import { IUserWithoutPassword } from './interfaces/user.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly findUserByIdUseCase: FindUserByIdUseCase) {}

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns user details',
    type: UserResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<IUserWithoutPassword | null> {
    const dto = new FindUserByIdDto();
    dto.id = id;

    const user = await this.findUserByIdUseCase.execute(dto);

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }
}
