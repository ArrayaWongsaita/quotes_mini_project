import { Injectable, NotFoundException } from '@nestjs/common';
import { FindUserByIdUseCase } from '../../users/use-cases/find-user-by-id.use-case';
import { FindUserByIdDto } from '../../users/dto/find-user-by-id.dto';
import { IUserWithoutPassword } from '../../users/interfaces/user.interface';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly findUserByIdUseCase: FindUserByIdUseCase) {}

  async execute(userId: string): Promise<IUserWithoutPassword> {
    // Create the DTO for finding user by id
    const findUserDto = new FindUserByIdDto();
    findUserDto.id = userId;

    // Get full user details from database
    const user = await this.findUserByIdUseCase.execute(findUserDto);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
