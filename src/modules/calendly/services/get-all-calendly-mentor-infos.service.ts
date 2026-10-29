import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CalendlyRepository } from '../repository/calendly.repository';

@Injectable()
export class GetAllCalendlyMentorInfosService {
  constructor(private readonly calendlyRepository: CalendlyRepository) {}

  async execute() {
    try {
      const calendlyInfo =
        await this.calendlyRepository.getAllCalendlyMentorInfos();

      return calendlyInfo.map((info) => ({
        id: info.id,
        mentorId: info.mentorId,
        calendlyName: info.calendlyName,
        agendaName: info.agendaName,
      }));
    } catch (error) {
      console.error(
        'Error returning Calendly info:',
        error instanceof Error ? error.message : error,
      );

      throw new InternalServerErrorException(
        'Could not find Calendly info in the database',
      );
    }
  }
}
