import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CalendlyRepository } from "../repository/calendly.repository";


@Injectable()
export class GetCalendlyMentorInfoService {
  constructor(private readonly calendlyRepository: CalendlyRepository) {}

  async execute(mentorId: string) {
    try {
      const calendlyInfo = await this.calendlyRepository.getCalendlyInfoByMentorId(mentorId)
      if (!calendlyInfo) {
        return null;
      }

      return {
        id: calendlyInfo.id,
        mentorId: calendlyInfo.mentorId,
        calendlyName: calendlyInfo.calendlyName,
        agendaName: calendlyInfo.agendaName,
        isConnected: Boolean(
          calendlyInfo.calendlyAccessToken && calendlyInfo.calendlyRefreshToken,
        ),
      };
    } catch (error) {
      console.error('Error returning Calendly info:', error.message);
      throw new InternalServerErrorException(
        'Could not find Calendly info in the database',
      );
    }
  }
}
