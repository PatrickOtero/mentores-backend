import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CalendlyRepository } from '../repository/calendly.repository';
import { CreateCalendlyInfoDto } from '../dto/calendly-info-dto';

@Injectable()
export class CreateCalendlyInfoService {
  constructor(private readonly calendlyRepository: CalendlyRepository) {}

  async execute(data: CreateCalendlyInfoDto, mentorId: string) {
    try {
      const calendlyInfo = await this.calendlyRepository.createCalendlyInfo(
        data,
        mentorId,
      );
      return calendlyInfo;
    } catch (error) {
      console.error('Error updating Calendly info:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Could not update Calendly info in the database',
      );
    }
  }
}
