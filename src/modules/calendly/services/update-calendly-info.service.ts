import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CalendlyRepository } from '../repository/calendly.repository';
import { UpdateCalendlyInfoDto } from '../dto/calendly-info-dto';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { MailService } from 'src/modules/mails/mail.service';

@Injectable()
export class UpdateCalendlyInfoService {
  constructor(
    private readonly calendlyRepository: CalendlyRepository,
    private readonly mentorRepository: MentorRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(
    mentorId: string,
    data: UpdateCalendlyInfoDto,
    mentorEmail?: string,
    shouldRegisterComplete = true,
  ) {
    try {
      if (shouldRegisterComplete) {
        await this.mentorRepository.registerCompleteToggle(mentorId);
      }

      const calendlyInfo = await this.calendlyRepository.updateCalendlyInfo(
        mentorId,
        data,
      );

      if (mentorEmail) {
        void this.mailService.calendlyUpdated(mentorEmail).catch(() => {});
      }

      return calendlyInfo;
    } catch (error) {
      console.error('Error updating Calendly info:', error.message);
      throw new InternalServerErrorException(
        'Could not update Calendly info in the database',
      );
    }
  }
}
