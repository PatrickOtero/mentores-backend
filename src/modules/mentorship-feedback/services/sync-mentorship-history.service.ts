import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject, Injectable } from '@nestjs/common';
import { IHttpAdapter } from 'src/lib/adapter/httpAdapterInterface';
import { MailService } from 'src/modules/mails/mail.service';
import { UserRepository } from 'src/modules/user/user.repository';
import { CalendlyRepository } from 'src/modules/calendly/repository/calendly.repository';
import { RefreshTokenService } from 'src/modules/calendly/services/refresh-token.service';
import { MentorshipFeedbackRepository } from '../repository/mentorship-feedback.repository';

interface ConnectedCalendlyInfo {
  mentorId: string;
  calendlyUserUuid?: string | null;
  calendlyAccessToken?: string | null;
  calendlyRefreshToken?: string | null;
  accessTokenExpiration?: Date | null;
  mentor?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

@Injectable()
export class SyncMentorshipHistoryService {
  constructor(
    private readonly mentorshipFeedbackRepository: MentorshipFeedbackRepository,
    private readonly calendlyRepository: CalendlyRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    @Inject('IHttpAdapter') private readonly httpAdapter: IHttpAdapter,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncAllCompletedSessions() {
    const connectedCalendlyInfos =
      await this.calendlyRepository.getConnectedCalendlySyncInfos();

    for (const calendlyInfo of connectedCalendlyInfos) {
      await this.syncMentorCompletedSessions(calendlyInfo).catch((error) => {
        console.error(
          `Error syncing mentorship sessions for mentor ${calendlyInfo.mentorId}:`,
          error?.message || error,
        );
      });
    }
  }

  async syncMenteeSessionsByEmail(email: string) {
    const connectedCalendlyInfos =
      await this.calendlyRepository.getConnectedCalendlySyncInfos();

    for (const calendlyInfo of connectedCalendlyInfos) {
      await this.syncMentorCompletedSessions(calendlyInfo, email).catch(
        (error) => {
          console.error(
            `Error syncing mentorship sessions for mentee ${email}:`,
            error?.message || error,
          );
        },
      );
    }
  }

  private async syncMentorCompletedSessions(
    calendlyInfo: ConnectedCalendlyInfo,
    menteeEmail?: string,
  ) {
    if (!calendlyInfo.calendlyAccessToken) {
      return;
    }

    const accessToken = await this.resolveAccessToken(calendlyInfo);
    const calendlyUserUuid =
      calendlyInfo.calendlyUserUuid ||
      (await this.fetchAndSaveMentorUuid(calendlyInfo.mentorId, accessToken));
    const userUri = `https://api.calendly.com/users/${calendlyUserUuid}`;
    const latestHistory =
      await this.mentorshipFeedbackRepository.findLatestHistoryEndTimeByMentorId(
        calendlyInfo.mentorId,
      );

    const completedEvents = await this.fetchCompletedEvents(
      userUri,
      accessToken,
      latestHistory?.endTime || undefined,
    );

    for (const event of completedEvents) {
      const invitees = await this.fetchEventInvitees(event.uri, accessToken);

      for (const invitee of invitees) {
        if (menteeEmail && invitee.email !== menteeEmail) {
          continue;
        }

        const mentee = await this.userRepository.findUserByEmail(invitee.email);

        if (!mentee || mentee.deleted) {
          continue;
        }

        const session =
          await this.mentorshipFeedbackRepository.upsertHistorySession({
            mentor_id: calendlyInfo.mentorId,
            mentee_id: mentee.id,
            status: 'COMPLETED',
            duration: this.calculateDuration(event.start_time, event.end_time),
            happened_at: event.end_time,
            eventName: event.name,
            description: event.description || '',
            joinUrl: event.location?.join_url || '',
            cancelUrl: invitee.cancel_url || '',
            rescheduleUrl: invitee.reschedule_url || '',
            inviteeName: invitee.name,
            inviteeEmail: invitee.email,
            startTime: event.start_time,
            endTime: event.end_time,
            calendlyEventUri: event.uri,
            calendlyEventUuid: event.uri.split('/').pop(),
            calendlyInviteeUri: invitee.uri || '',
          });

        if (session.mentorshipFeedback || session.feedbackRequestedAt) {
          continue;
        }

        await this.mailService.userSendMentorshipFeedbackRequest({
          email: mentee.email,
          fullName: mentee.fullName,
          mentorName: session.mentors.fullName,
          sessionDate: event.end_time,
          feedbackUrl: `${process.env.FRONTEND_URL}/avaliacoes/${session.id}`,
        });

        await this.mentorshipFeedbackRepository.markFeedbackRequested(
          session.id,
          new Date(),
        );
      }
    }
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

  private async fetchAndSaveMentorUuid(mentorId: string, accessToken: string) {
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
  }

  private async fetchCompletedEvents(
    userUri: string,
    accessToken: string,
    latestEndTime?: Date,
  ) {
    const completedEvents = [];
    const now = Date.now();
    const query = new URLSearchParams({
      user: userUri,
      status: 'active',
      sort: 'start_time:desc',
      count: '100',
    });

    const minStartTime = latestEndTime
      ? new Date(latestEndTime.getTime() - 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    query.set('min_start_time', minStartTime);

    let pageToken: string | undefined;

    do {
      if (pageToken) {
        query.set('page_token', pageToken);
      } else {
        query.delete('page_token');
      }

      const response = await this.httpAdapter.get(
        `/scheduled_events?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      for (const event of response.collection || []) {
        const eventEndTime = new Date(
          event.end_time || event.start_time,
        ).getTime();

        if (!Number.isNaN(eventEndTime) && eventEndTime <= now) {
          completedEvents.push(event);
        }
      }

      pageToken = response.pagination?.next_page_token;
    } while (pageToken);

    return completedEvents;
  }

  private async fetchEventInvitees(eventUri: string, accessToken: string) {
    const response = await this.httpAdapter.get(`${eventUri}/invitees`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    return response.collection || [];
  }

  private calculateDuration(startTime?: string, endTime?: string) {
    if (!startTime || !endTime) {
      return '';
    }

    const durationMs =
      new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.max(Math.floor(durationMs / (1000 * 60)), 0);

    return `${minutes} minutes`;
  }
}
