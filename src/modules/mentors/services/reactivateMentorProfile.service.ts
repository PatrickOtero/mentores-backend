import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from '../repository/mentor.repository';

@Injectable()
export class ReactivateMentorProfileService {
  constructor(
    private readonly mentorRepository: MentorRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(email: string) {
    const mentor = await this.mentorRepository.findMentorByEmail(email);

    if (!mentor || mentor.deleted) {
      throw new BadRequestException('Mentor profile not found');
    }

    if (!mentor.isProfilePaused) {
      return {
        status: 200,
        data: { message: 'Mentor profile already active' },
      };
    }

    await this.mentorRepository.updateMentor(mentor.id, {
      isProfilePaused: false,
    });
    await this.mailService.mentorSendReactivationConfirmation(mentor);

    return {
      status: 200,
      data: { message: 'Mentor profile reactivated successfully' },
    };
  }
}
