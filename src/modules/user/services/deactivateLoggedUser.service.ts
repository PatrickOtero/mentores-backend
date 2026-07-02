import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginTypeEnum } from 'src/modules/auth/enums/login-type.enum';
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from '../user.repository';

@Injectable()
export class DesactivateLoggedUserService {
  constructor(
    private userRepository: UserRepository,
    private mentorRepository: MentorRepository,
    private mailService: MailService,
  ) {}

  async execute(
    email: string,
    options?: {
      shouldSendEmail?: boolean;
      ignoreMissingProfile?: boolean;
    },
  ): Promise<{ message: string; deleted: boolean }> {
    const userExists = await this.userRepository.findUserByEmail(email);

    if (!userExists || userExists.deleted) {
      if (options?.ignoreMissingProfile) {
        return {
          message: 'User profile not found',
          deleted: false,
        };
      }

      throw new BadRequestException('User profile not found');
    }

    await this.userRepository.desativateUserById(userExists.id);

    const mentorProfile = await this.mentorRepository.findMentorByEmail(email);

    if (mentorProfile && !mentorProfile.deleted) {
      await this.mentorRepository.updateMentor(mentorProfile.id, {
        defaultProfile: LoginTypeEnum.MENTOR,
      });
      await this.userRepository.updateUser(userExists.id, {
        defaultProfile: LoginTypeEnum.MENTOR,
      });
    }

    if (options?.shouldSendEmail !== false) {
      await this.mailService.userSendDeletionConfirmation(userExists);
    }

    return { message: 'Mentee profile deleted successfully', deleted: true };
  }
}
