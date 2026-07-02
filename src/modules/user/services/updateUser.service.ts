import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CustomNotFoundException } from '../../../shared/exceptions/notFound.exception';
import { CustomBadRequestException } from '../../../shared/exceptions/badRequest.exception';

@Injectable()
export class UpdateUserService {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, data: UpdateUserDto) {
    const userExists = await this.userRepository.findUserById(id);

    if (!userExists) {
      throw new CustomNotFoundException('There are no User with that id');
    }

    if (
      data.registerComplete === undefined &&
      data.specialties?.length &&
      data.aboutMe !== undefined
    ) {
      data.registerComplete = true;
    }

    try {
      await this.userRepository.updateUser(id, data);

      return { message: 'The User was updated successfully', status: 200 };
    } catch (error) {
      throw new CustomBadRequestException(
        'Something went wrong in the database',
      );
    }
  }
}
