import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IHttpAdapter } from '../../../lib/adapter/httpAdapterInterface';
import { CalendlyRepository } from '../repository/calendly.repository';
import {
  CancelCalendlyScheduleDto,
  CreateCalendlyInviteeDto,
  GetCalendlyAvailableTimesDto,
} from '../dto/calendly-scheduling.dto';
import { RefreshTokenService } from './refresh-token.service';

interface CalendlyEventType {
  uri: string;
  name: string;
  scheduling_url?: string;
  slug?: string;
  active?: boolean;
}

interface CalendlyAccessData {
  accessToken: string;
  eventType: CalendlyEventType;
}

@Injectable()
export class CalendlySchedulingService {
  constructor(
    private readonly calendlyRepository: CalendlyRepository,
    private readonly refreshTokenService: RefreshTokenService,
    @Inject('IHttpAdapter') private readonly httpAdapter: IHttpAdapter,
  ) {}

  async getAvailableTimes(mentorId: string, query: GetCalendlyAvailableTimesDto) {
    const { accessToken, eventType } = await this.getCalendlyAccessData(mentorId);
    const ranges = this.buildCalendlyRanges(query.startTime, query.endTime);
    const availableTimes = [];

    try {
      for (const range of ranges) {
        const response = await this.httpAdapter.get(
          `/event_type_available_times?event_type=${encodeURIComponent(
            eventType.uri,
          )}&start_time=${encodeURIComponent(
            range.startTime,
          )}&end_time=${encodeURIComponent(range.endTime)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          },
        );

        availableTimes.push(...(response.collection || []));
      }

      return {
        eventType: {
          uri: eventType.uri,
          name: eventType.name,
          schedulingUrl: eventType.scheduling_url,
        },
        availableTimes,
      };
    } catch (error) {
      console.error(
        'Error fetching Calendly available times:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Não foi possível buscar os horários disponíveis no Calendly.',
      );
    }
  }

  async createInvitee(
    mentorId: string,
    invitee: { fullName: string; email: string },
    data: CreateCalendlyInviteeDto,
  ) {
    const { eventType } = await this.getCalendlyAccessData(mentorId);

    return {
      schedulingUrl: this.buildPrefilledSchedulingUrl(
        data.schedulingUrl || eventType.scheduling_url,
        invitee,
        data,
      ),
      selectedStartTime: data.startTime,
      scheduled: false,
      requiresCalendlyRedirect: true,
    };
  }

  async cancelSchedule(
    mentorId: string,
    eventUuid: string,
    data: CancelCalendlyScheduleDto,
  ) {
    const accessToken = await this.getValidAccessToken(mentorId);

    try {
      const response = await this.httpAdapter.post(
        `/scheduled_events/${eventUuid}/cancellation`,
        {
          reason: data.reason || 'Cancelado pelo Portal de Mentorias.',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.resource || response;
    } catch (error) {
      if (this.isPastEventCancellationError(error)) {
        return {
          message: 'Agendamento já ocorreu e não pode mais ser cancelado no Calendly.',
          status: 'past_event',
        };
      }

      console.error(
        'Error canceling Calendly scheduled event:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Não foi possível cancelar o agendamento no Calendly.',
      );
    }
  }

  private async getCalendlyAccessData(
    mentorId: string,
  ): Promise<CalendlyAccessData> {
    const accessToken = await this.getValidAccessToken(mentorId);
    const eventType = await this.getMentorEventType(mentorId, accessToken);

    return { accessToken, eventType };
  }

  private async getValidAccessToken(mentorId: string): Promise<string> {
    const calendlyInfo =
      await this.calendlyRepository.getCalendlyInfoByMentorId(mentorId);

    if (!calendlyInfo?.calendlyAccessToken) {
      throw new NotFoundException('Mentor não conectado ao Calendly.');
    }

    if (
      calendlyInfo.accessTokenExpiration &&
      new Date() >= new Date(calendlyInfo.accessTokenExpiration)
    ) {
      return this.refreshTokenService.execute(mentorId);
    }

    return calendlyInfo.calendlyAccessToken;
  }

  private async getMentorEventType(
    mentorId: string,
    accessToken: string,
  ): Promise<CalendlyEventType> {
    const calendlyInfo =
      await this.calendlyRepository.getCalendlyInfoByMentorId(mentorId);

    const calendlyUserUuid =
      calendlyInfo?.calendlyUserUuid ||
      (await this.fetchAndSaveMentorUuid(mentorId, accessToken));

    const userUri = `https://api.calendly.com/users/${calendlyUserUuid}`;

    try {
      const response = await this.httpAdapter.get(
        `/event_types?user=${encodeURIComponent(userUri)}&active=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      const eventTypes: CalendlyEventType[] = response.collection || [];
      const schedulingUrl = this.buildSchedulingUrl(
        calendlyInfo.calendlyName,
        calendlyInfo.agendaName,
      );

      const eventType = eventTypes.find(type => {
        const typeUrl = type.scheduling_url?.replace(/\/$/, '');
        return (
          typeUrl === schedulingUrl ||
          type.slug === calendlyInfo.agendaName ||
          type.uri?.endsWith(`/${calendlyInfo.agendaName}`)
        );
      });

      if (!eventType) {
        throw new NotFoundException(
          'Tipo de evento do Calendly não encontrado para este mentor.',
        );
      }

      return eventType;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(
        'Error fetching Calendly event types:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Não foi possível buscar o tipo de evento do Calendly.',
      );
    }
  }

  private buildSchedulingUrl(calendlyName?: string, agendaName?: string) {
    if (!calendlyName || !agendaName) {
      throw new BadRequestException(
        'Link do Calendly não configurado para este mentor.',
      );
    }

    return new URL(`${calendlyName}/${agendaName}`, 'https://calendly.com')
      .toString()
      .replace(/\/$/, '');
  }

  private buildPrefilledSchedulingUrl(
    schedulingUrl: string,
    invitee: { fullName: string; email: string },
    data: CreateCalendlyInviteeDto,
  ) {
    if (!schedulingUrl) {
      throw new BadRequestException(
        'Link do Calendly não configurado para este mentor.',
      );
    }

    const url = new URL(schedulingUrl);
    const selectedDate = new Date(data.startTime);

    url.searchParams.set('name', invitee.fullName);
    url.searchParams.set('email', invitee.email);
    url.searchParams.set('timezone', data.timezone);

    if (!Number.isNaN(selectedDate.getTime())) {
      const date = selectedDate.toISOString().slice(0, 10);
      url.searchParams.set('date', date);
      url.searchParams.set('month', date.slice(0, 7));
    }

    if (data.description) {
      url.searchParams.set('a1', data.description);
    }

    return url.toString();
  }

  private async fetchAndSaveMentorUuid(
    mentorId: string,
    accessToken: string,
  ): Promise<string> {
    try {
      const response = await this.httpAdapter.get('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      const mentorUuid = response.resource.uri.split('/').pop();
      await this.calendlyRepository.updateCalendlyInfo(mentorId, {
        calendlyUserUuid: mentorUuid,
      });

      return mentorUuid;
    } catch (error) {
      console.error(
        'Error fetching Calendly user UUID:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Não foi possível identificar o usuário do Calendly.',
      );
    }
  }

  private buildCalendlyRanges(startTime: string, endTime: string) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Intervalo de datas inválido.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        'A data final precisa ser posterior à data inicial.',
      );
    }

    const nowWithBuffer = new Date(Date.now() + 10000);
    let currentStart = startDate < nowWithBuffer ? nowWithBuffer : startDate;
    const ranges = [];

    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 7);

      ranges.push({
        startTime: currentStart.toISOString(),
        endTime:
          currentEnd < endDate ? currentEnd.toISOString() : endDate.toISOString(),
      });

      currentStart = currentEnd;
    }

    return ranges;
  }

  private isPastEventCancellationError(error: any) {
    const responseData = error.response?.data;

    return (
      responseData?.title === 'Permission Denied' &&
      responseData?.message === 'Event in the past'
    );
  }
}
