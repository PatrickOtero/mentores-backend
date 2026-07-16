import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CalendlyRepository } from '../repository/calendly.repository';
import { CreateCalendlyInfoDto } from '../dto/calendly-info-dto';
import { MailService } from 'src/modules/mails/mail.service';

@Injectable()
export class CreateCalendlyInfoService {
  constructor(
    private readonly calendlyRepository: CalendlyRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(
    data: CreateCalendlyInfoDto,
    mentorId: string,
    mentorEmail?: string,
  ) {
    try {
      const calendlyInfo = await this.calendlyRepository.createCalendlyInfo(
        data,
        mentorId,
      );

      if (mentorEmail) {
        void this.mailService.calendlyUpdated(mentorEmail).catch(() => {});
      }

      return calendlyInfo;
    } catch (error) {
      console.error('Error creating Calendly info:', error.message);
      throw new InternalServerErrorException(
        'Could not create Calendly info in the database',
      );
    }
  }
}
