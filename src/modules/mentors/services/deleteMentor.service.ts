import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginTypeEnum } from 'src/modules/auth/enums/login-type.enum';
import { MailService } from 'src/modules/mails/mail.service';
import { UserRepository } from 'src/modules/user/user.repository';
import { MentorRepository } from '../repository/mentor.repository';

@Injectable()
export class DeleteMentorService {
  constructor(
    private mentorRepository: MentorRepository,
    private userRepository: UserRepository,
    private mailService: MailService,
  ) {}

  async execute(
    email: string,
    options?: {
      shouldSendEmail?: boolean;
      ignoreMissingProfile?: boolean;
    },
  ): Promise<{ message: string; deleted: boolean }> {
    const mentorExists = await this.mentorRepository.findMentorByEmail(email);

    if (!mentorExists || mentorExists.deleted) {
      if (options?.ignoreMissingProfile) {
        return {
          message: 'Mentor profile not found',
          deleted: false,
        };
      }

      throw new BadRequestException('Mentor profile not found');
    }

    await this.mentorRepository.deactivateMentorById(mentorExists.id);

    const userProfile = await this.userRepository.findUserByEmail(email);

    if (userProfile && !userProfile.deleted) {
      await this.userRepository.updateUser(userProfile.id, {
        defaultProfile: LoginTypeEnum.USER,
      });
      await this.mentorRepository.updateMentor(mentorExists.id, {
        defaultProfile: LoginTypeEnum.USER,
      });
    }

    if (options?.shouldSendEmail !== false) {
      await this.mailService.mentorSendDeletionConfirmation(mentorExists);
    }

    return { message: 'Mentor profile deleted successfully', deleted: true };
  }
}
