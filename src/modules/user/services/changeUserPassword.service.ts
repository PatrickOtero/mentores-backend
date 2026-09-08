import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../user.repository';
import { UserChangePassDto } from '../dto/user-change-pass.dto';
import { MailService } from 'src/modules/mails/mail.service';

@Injectable()
export class ChangeUserPasswordService {
  constructor(
    private userRepository: UserRepository,
    private mailService: MailService,
  ) {}

  async execute(user: UserEntity, data: UserChangePassDto) {
    const loggedUser = await this.userRepository.findFullUserById(user.id);

    const isPassCorrect = await bcrypt.compare(
      data.oldPassword,
      loggedUser.password,
    );

    if (!isPassCorrect) {
      return {
        status: 400,
        message: 'Incorrect old password',
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      await this.userRepository.updateUser(user.id, {
        password: hashedPassword,
      });
    } catch (error) {
      return {
        status: 400,
        message: 'Something went wrong in the database',
      };
    }

    try {
      await this.mailService.userSendPasswordUpdatedConfirmation(loggedUser);
    } catch (error) {
      console.error('Failed to send password update confirmation email', error);
    }

    return {
      status: 200,
      message: 'Password changed successfully',
    };
  }
}
