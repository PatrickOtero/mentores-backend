import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { IHttpAdapter } from '../../../lib/adapter/httpAdapterInterface';
import { UserEntity } from '../../user/entities/user.entity';
import { UserRepository } from '../../user/user.repository';
import { CalendlyRepository } from '../repository/calendly.repository';
import { RefreshTokenService } from './refresh-token.service';
import { MentorshipFeedbackRepository } from '../../mentorship-feedback/repository/mentorship-feedback.repository';
import { SyncMentorshipHistoryService } from '../../mentorship-feedback/services/sync-mentorship-history.service';

type ConnectedCalendlyInfo = Awaited<
  ReturnType<CalendlyRepository['getConnectedCalendlySyncInfos']>
>[number];

type MenteeSchedule = {
  eventUuid: string;
  eventUri: string;
  eventName: string;
  description: string;
  startTime: Date | string;
  endTime: Date | string | null;
  duration: string;
  joinUrl: string;
  eventUrl: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  status: 'pending' | 'scheduled' | 'completed';
  mentor: {
    id: string;
    fullName: string;
  };
};

@Injectable()
export class FetchSchedulesService {
  constructor(
    private readonly calendlyRepository: CalendlyRepository,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mentorshipFeedbackRepository: MentorshipFeedbackRepository,
    private readonly syncMentorshipHistoryService: SyncMentorshipHistoryService,
    @Inject('IHttpAdapter') private readonly httpAdapter: IHttpAdapter,
  ) {}

  async getMentorSchedules(mentorId: string) {
    const calendlyInfo =
      await this.calendlyRepository.getCalendlyInfoByMentorId(mentorId);

    if (!calendlyInfo || !calendlyInfo.calendlyAccessToken) {
      throw new Error('Mentor not connected to Calendly');
    }

    let accessToken = calendlyInfo.calendlyAccessToken;

    if (
      calendlyInfo.accessTokenExpiration &&
      new Date() >= new Date(calendlyInfo.accessTokenExpiration)
    ) {
      accessToken = await this.refreshTokenService.execute(mentorId);
    }

    if (!calendlyInfo.calendlyUserUuid) {
      calendlyInfo.calendlyUserUuid = await this.fetchAndSaveMentorUuid(
        mentorId,
        accessToken,
      );
    }

    const userUrlUuid = `https://api.calendly.com/users/${calendlyInfo.calendlyUserUuid}`;

    try {
      const eventsResponse = await this.httpAdapter.get(
        `/scheduled_events?user=${userUrlUuid}&status=active&sort=start_time:desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const upcomingEvents = this.filterUpcomingEvents(
        eventsResponse.collection || [],
      );
      return await this.extractMentorEventData(upcomingEvents, accessToken);
    } catch (error: any) {
      console.error('Error fetching scheduled events:', error.response?.data);
      throw new Error('Could not fetch scheduled events from Calendly');
    }
  }

  async getMenteeSchedules(loggedUser: UserEntity) {
    const menteeProfile = await this.userRepository.findUserByEmail(
      loggedUser.email,
    );

    if (
      !menteeProfile ||
      menteeProfile.deleted ||
      menteeProfile.id !== loggedUser.id
    ) {
      throw new ForbiddenException('Active profile is not a mentee profile');
    }

    await this.syncMentorshipHistoryService.syncMenteeSessionsByEmail(
      menteeProfile.email,
    );

    const upcomingSchedules = await this.fetchUpcomingMenteeSchedules(
      menteeProfile,
    );
    const scheduleHistory =
      await this.mentorshipFeedbackRepository.findMenteeScheduleHistory(
        menteeProfile.id,
      );

    const persistedSchedules = scheduleHistory.map((session) => {
      const status = this.normalizeScheduleStatus(
        session.status,
        session.endTime,
      );

      return {
        eventUuid: session.calendlyEventUuid || session.id,
        eventUri: session.calendlyEventUri || session.calendlyInviteeUri || '',
        eventName: session.eventName || 'Mentoria',
        description: session.description || '',
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration || '',
        joinUrl: session.joinUrl || '',
        eventUrl: this.buildMenteeEventUrl(status, session.calendlyEventUuid),
        cancelUrl: session.cancelUrl || '',
        rescheduleUrl: session.rescheduleUrl || '',
        status,
        mentor: {
          id: session.mentors.id,
          fullName: session.mentors.fullName,
        },
      } satisfies MenteeSchedule;
    });

    const schedulesByEventUuid = new Map<string, MenteeSchedule>();

    for (const schedule of [...persistedSchedules, ...upcomingSchedules]) {
      const key = this.buildScheduleKey(schedule);
      const existingSchedule = schedulesByEventUuid.get(key);

      if (!existingSchedule) {
        schedulesByEventUuid.set(key, schedule);
        continue;
      }

      schedulesByEventUuid.set(
        key,
        this.mergeMenteeSchedules(existingSchedule, schedule),
      );
    }

    return Array.from(schedulesByEventUuid.values()).sort((first, second) => {
      if (first.status !== second.status) {
        return (
          this.getScheduleStatusOrder(first.status) -
          this.getScheduleStatusOrder(second.status)
        );
      }

      const firstTime = new Date(first.startTime || 0).getTime();
      const secondTime = new Date(second.startTime || 0).getTime();

      if (first.status !== 'completed') {
        return firstTime - secondTime;
      }

      return secondTime - firstTime;
    });
  }

  private mergeMenteeSchedules(
    currentSchedule: MenteeSchedule,
    incomingSchedule: MenteeSchedule,
  ): MenteeSchedule {
    const currentPriority = this.getScheduleStatusPriority(
      currentSchedule.status,
    );
    const incomingPriority = this.getScheduleStatusPriority(
      incomingSchedule.status,
    );

    const primarySchedule =
      incomingPriority >= currentPriority ? incomingSchedule : currentSchedule;

    const secondarySchedule =
      incomingPriority >= currentPriority ? currentSchedule : incomingSchedule;

    return {
      ...secondarySchedule,
      ...primarySchedule,

      eventUuid: primarySchedule.eventUuid || secondarySchedule.eventUuid,
      eventUri: primarySchedule.eventUri || secondarySchedule.eventUri,
      eventName: primarySchedule.eventName || secondarySchedule.eventName,
      description: primarySchedule.description || secondarySchedule.description,
      startTime: primarySchedule.startTime || secondarySchedule.startTime,
      endTime: primarySchedule.endTime || secondarySchedule.endTime,
      duration: primarySchedule.duration || secondarySchedule.duration,
      joinUrl: primarySchedule.joinUrl || secondarySchedule.joinUrl,
      eventUrl: primarySchedule.eventUrl || secondarySchedule.eventUrl,
      cancelUrl: primarySchedule.cancelUrl || secondarySchedule.cancelUrl,
      rescheduleUrl:
        primarySchedule.rescheduleUrl || secondarySchedule.rescheduleUrl,
      status: primarySchedule.status,
      mentor: {
        id: primarySchedule.mentor.id || secondarySchedule.mentor.id,
        fullName:
          primarySchedule.mentor.fullName || secondarySchedule.mentor.fullName,
      },
    };
  }

  private getScheduleStatusPriority(status: MenteeSchedule['status']) {
    if (status === 'completed') {
      return 3;
    }

    if (status === 'scheduled') {
      return 2;
    }

    if (status === 'pending') {
      return 1;
    }

    return 0;
  }

  private async fetchUpcomingMenteeSchedules(mentee: UserEntity) {
    const connectedCalendlyInfos =
      await this.calendlyRepository.getConnectedCalendlySyncInfos();
    const schedules: MenteeSchedule[] = [];

    for (const calendlyInfo of connectedCalendlyInfos) {
      if (!calendlyInfo.calendlyAccessToken) {
        continue;
      }

      try {
        const accessToken = await this.resolveAccessToken(calendlyInfo);
        const calendlyUserUuid =
          calendlyInfo.calendlyUserUuid ||
          (await this.fetchAndSaveMentorUuid(
            calendlyInfo.mentorId,
            accessToken,
          ));
        const userUrlUuid = `https://api.calendly.com/users/${calendlyUserUuid}`;

        const eventsResponse = await this.httpAdapter.get(
          `/scheduled_events?user=${userUrlUuid}&status=active&sort=start_time:asc`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          },
        );

        const upcomingEvents = this.filterUpcomingEvents(
          eventsResponse.collection || [],
        );
        const mentorSchedules = await this.extractMenteeEventData(
          upcomingEvents,
          accessToken,
          mentee,
          calendlyInfo,
        );

        schedules.push(...mentorSchedules);
      } catch (error: any) {
        console.error(
          `Error fetching mentee schedules for mentor ${calendlyInfo.mentorId}:`,
          error?.message || error,
        );
      }
    }

    return schedules;
  }

  private async fetchAndSaveMentorUuid(
    mentorId: string,
    accessToken: string,
  ): Promise<string> {
    try {
      const response = await this.httpAdapter.get('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const mentorUuid = response.resource.uri.split('/').pop();
      await this.calendlyRepository.updateCalendlyInfo(mentorId, {
        calendlyUserUuid: mentorUuid,
      });
      return mentorUuid;
    } catch (error: any) {
      console.error('Error fetching mentor UUID:', error.response?.data);
      throw new Error('Could not fetch mentor UUID from Calendly');
    }
  }

  private async extractMentorEventData(events: any[], accessToken: string) {
    const eventDetails = [];

    for (const event of events) {
      const inviteesResponse = await this.httpAdapter.get(
        `${event.uri}/invitees`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const eventId = event.uri.split('/').pop();

      const participants = inviteesResponse.collection.map((invitee) => ({
        name: invitee.name,
        email: invitee.email,
        questions: invitee.questions_and_answers.map((qa) => ({
          question: qa.question,
          answer: qa.answer,
        })),
      }));

      eventDetails.push({
        eventUuid: eventId,
        eventUri: event.uri,
        eventName: event.name,
        description: event.description || 'No description provided',
        startTime: event.start_time,
        endTime: event.end_time,
        duration: this.calculateDuration(event.start_time, event.end_time),
        joinUrl: event.location?.join_url || 'No meeting link provided',
        eventUrl: `https://calendly.com/app/scheduled_events/user/me?period=upcoming&uuid=${eventId}`,
        participants,
      });
    }

    return eventDetails;
  }

  private async extractMenteeEventData(
    events: any[],
    accessToken: string,
    mentee: UserEntity,
    calendlyInfo: ConnectedCalendlyInfo,
  ) {
    const eventDetails: MenteeSchedule[] = [];

    for (const event of events) {
      const inviteesResponse = await this.httpAdapter.get(
        `${event.uri}/invitees`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      const menteeEmail = this.normalizeEmail(mentee.email);

      const invitee = inviteesResponse.collection?.find(
        (currentInvitee) =>
          this.normalizeEmail(currentInvitee.email) === menteeEmail,
      );

      if (!invitee) {
        continue;
      }

      const eventId = event.uri.split('/').pop();
      const persistedSession =
        await this.mentorshipFeedbackRepository.upsertHistorySession({
          mentor_id: calendlyInfo.mentorId,
          mentee_id: mentee.id as string,
          status: 'SCHEDULED',
          eventName: event.name || 'Mentoria',
          description:
            this.extractInviteeDescription(invitee) || event.description || '',
          duration: this.calculateDuration(event.start_time, event.end_time),
          joinUrl: event.location?.join_url || '',
          cancelUrl: invitee.cancel_url || '',
          rescheduleUrl: invitee.reschedule_url || '',
          inviteeName: invitee.name || mentee.fullName,
          inviteeEmail: invitee.email || mentee.email,
          startTime: event.start_time,
          endTime: event.end_time,
          calendlyEventUri: event.uri,
          calendlyEventUuid: eventId,
          calendlyInviteeUri: invitee.uri || '',
        });

      eventDetails.push({
        eventUuid: persistedSession.calendlyEventUuid || persistedSession.id,
        eventUri:
          persistedSession.calendlyEventUri ||
          persistedSession.calendlyInviteeUri ||
          event.uri,
        eventName: persistedSession.eventName || event.name || 'Mentoria',
        description: persistedSession.description || '',
        startTime: persistedSession.startTime || event.start_time,
        endTime: persistedSession.endTime || event.end_time,
        duration:
          persistedSession.duration ||
          this.calculateDuration(event.start_time, event.end_time),
        joinUrl: persistedSession.joinUrl || event.location?.join_url || '',
        eventUrl: this.buildMenteeEventUrl(
          'scheduled',
          persistedSession.calendlyEventUuid || eventId,
        ),
        cancelUrl: persistedSession.cancelUrl || invitee.cancel_url || '',
        rescheduleUrl:
          persistedSession.rescheduleUrl || invitee.reschedule_url || '',
        status: 'scheduled',
        mentor: {
          id: calendlyInfo.mentorId,
          fullName: calendlyInfo.mentor?.fullName || 'Mentor(a)',
        },
      });
    }

    return eventDetails;
  }

  private normalizeEmail(email?: string | null) {
    return email?.trim().toLowerCase() || '';
  }

  private calculateDuration(startTime: string, endTime: string): string {
    const durationMs =
      new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    return `${minutes} minutes`;
  }

  private extractInviteeDescription(invitee: any) {
    return (
      invitee?.questions_and_answers?.find((answer) => answer?.answer?.trim())
        ?.answer || ''
    );
  }

  private normalizeScheduleStatus(
    status?: string,
    endTime?: Date | string | null,
  ) {
    if (status === 'PENDING') {
      return 'pending' as const;
    }

    if (status === 'SCHEDULED') {
      return 'scheduled' as const;
    }

    if (status === 'COMPLETED') {
      return 'completed' as const;
    }

    if (endTime) {
      return 'completed' as const;
    }

    return 'scheduled' as const;
  }

  private buildMenteeEventUrl(
    status: MenteeSchedule['status'],
    calendlyEventUuid?: string | null,
  ) {
    if (!calendlyEventUuid) {
      return '';
    }

    const period = status === 'completed' ? 'past' : 'upcoming';
    return `https://calendly.com/app/scheduled_events/user/me?period=${period}&uuid=${calendlyEventUuid}`;
  }

  private getScheduleStatusOrder(status: MenteeSchedule['status']) {
    if (status === 'pending') {
      return 0;
    }

    if (status === 'scheduled') {
      return 1;
    }

    return 2;
  }

  private buildScheduleKey(schedule: MenteeSchedule) {
    return `${schedule.mentor.id}:${this.normalizeDateToMinute(
      schedule.startTime,
    )}`;
  }

  private filterUpcomingEvents(events: any[]): any[] {
    const now = Date.now();

    return events.filter((event) => {
      const eventEndTime = new Date(
        event.end_time || event.start_time,
      ).getTime();
      return !Number.isNaN(eventEndTime) && eventEndTime > now;
    });
  }

  private normalizeDateToMinute(value: Date | string | null | undefined) {
    if (!value) {
      return 'no-start-time';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'invalid-start-time';
    }

    date.setSeconds(0, 0);

    return date.toISOString();
  }

  private async resolveAccessToken(calendlyInfo: ConnectedCalendlyInfo) {
    if (
      calendlyInfo.accessTokenExpiration &&
      new Date() >= new Date(calendlyInfo.accessTokenExpiration)
    ) {
      return this.refreshTokenService.execute(calendlyInfo.mentorId);
    }

    return calendlyInfo.calendlyAccessToken as string;
  }
}
