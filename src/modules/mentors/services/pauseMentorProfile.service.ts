import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from 'src/modules/mails/mail.service';
import { LoginTypeEnum } from 'src/modules/auth/enums/login-type.enum';
import { UserRepository } from 'src/modules/user/user.repository';
import { MentorRepository } from '../repository/mentor.repository';

@Injectable()
export class PauseMentorProfileService {
  constructor(
    private readonly mentorRepository: MentorRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(email: string) {
    const mentor = await this.mentorRepository.findMentorByEmail(email);

    if (!mentor || mentor.deleted) {
      throw new BadRequestException('Mentor profile not found');
    }

    if (mentor.isProfilePaused) {
      return {
        status: 200,
        data: { message: 'Mentor profile already paused' },
      };
    }

    await this.mentorRepository.updateMentor(mentor.id, {
      isProfilePaused: true,
    });

    const menteeProfile = await this.userRepository.findUserByEmail(email);

    if (menteeProfile && !menteeProfile.deleted) {
      await this.mentorRepository.updateMentor(mentor.id, {
        defaultProfile: LoginTypeEnum.USER,
      });
      await this.userRepository.updateUser(menteeProfile.id, {
        defaultProfile: LoginTypeEnum.USER,
      });
    }

    await this.mailService.mentorSendPauseConfirmation(mentor);

    return {
      status: 200,
      data: { message: 'Mentor profile paused successfully' },
    };
  }
}
