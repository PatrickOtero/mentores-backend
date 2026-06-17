import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '../../mails/mail.service';
import { FetchSchedulesService } from '../../calendly/services/fetch-schedules.service';
import { MentorRepository } from '../../mentors/repository/mentor.repository';
import { DeleteMentorService } from '../../mentors/services/deleteMentor.service';
import { DesactivateLoggedUserService } from '../../user/services/deactivateLoggedUser.service';

@Injectable()
export class DeleteAccountService {
  constructor(
    private readonly deleteMentorService: DeleteMentorService,
    private readonly deleteUserService: DesactivateLoggedUserService,
    private readonly mailService: MailService,
    private readonly mentorRepository: MentorRepository,
    private readonly fetchSchedulesService: FetchSchedulesService,
  ) {}

  async execute(email: string, target: string) {
    if (target === 'mentor' || target === 'account') {
      await this.ensureMentorHasNoOpenSchedules(email);
    }

    if (target === 'mentor') {
      await this.deleteMentorService.execute(email, { shouldSendEmail: false });
      await this.mailService.sendAccountDeletionConfirmation(
        email,
        'perfil de mentor(a)',
      );

      return {
        status: 200,
        data: { message: 'Mentor profile deleted successfully' },
      };
    }

    if (target === 'mentee') {
      await this.deleteUserService.execute(email, { shouldSendEmail: false });
      await this.mailService.sendAccountDeletionConfirmation(
        email,
        'perfil de mentorado(a)',
      );

      return {
        status: 200,
        data: { message: 'Mentee profile deleted successfully' },
      };
    }

    if (target === 'account') {
      const mentorResult = await this.deleteMentorService.execute(email, {
        shouldSendEmail: false,
        ignoreMissingProfile: true,
      });
      const userResult = await this.deleteUserService.execute(email, {
        shouldSendEmail: false,
        ignoreMissingProfile: true,
      });

      if (!mentorResult.deleted && !userResult.deleted) {
        throw new BadRequestException('No active profile found for deletion');
      }

      await this.mailService.sendAccountDeletionConfirmation(email, 'conta');

      return {
        status: 200,
        data: { message: 'Account deleted successfully' },
      };
    }

    throw new BadRequestException('Invalid deletion target');
  }

  private async ensureMentorHasNoOpenSchedules(email: string) {
    const mentor = await this.mentorRepository.findMentorByEmail(email);

    if (!mentor || mentor.deleted) {
      return;
    }

    const schedules = await this.fetchSchedulesService
      .getMentorSchedules(mentor.id)
      .catch(() => []);

    if (schedules.length > 0) {
      throw new BadRequestException(
        'Cancel open mentor schedules before deleting this profile',
      );
    }
  }
}
