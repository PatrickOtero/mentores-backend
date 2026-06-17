import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IHttpAdapter } from 'src/lib/adapter/httpAdapterInterface';
import { MentorshipFeedbackRepository } from 'src/modules/mentorship-feedback/repository/mentorship-feedback.repository';
import { SyncMentorshipHistoryService } from 'src/modules/mentorship-feedback/services/sync-mentorship-history.service';
import { UserRepository } from 'src/modules/user/user.repository';
import { CalendlyRepository } from '../../repository/calendly.repository';
import { FetchSchedulesService } from '../../services/fetch-schedules.service';
import { RefreshTokenService } from '../../services/refresh-token.service';

describe('FetchSchedulesService', () => {
  let service: FetchSchedulesService;
  let calendlyRepository: CalendlyRepository;
  let userRepository: UserRepository;
  let refreshTokenService: RefreshTokenService;
  let mentorshipFeedbackRepository: MentorshipFeedbackRepository;
  let syncMentorshipHistoryService: SyncMentorshipHistoryService;
  let httpAdapter: IHttpAdapter;

  beforeEach(() => {
    calendlyRepository = {
      getConnectedCalendlySyncInfos: vi.fn(),
      updateCalendlyInfo: vi.fn(),
    } as any;

    userRepository = {
      findUserByEmail: vi.fn(),
    } as any;

    refreshTokenService = {
      execute: vi.fn(),
    } as any;

    mentorshipFeedbackRepository = {
      findMenteeScheduleHistory: vi.fn(),
      upsertHistorySession: vi.fn(),
    } as any;

    syncMentorshipHistoryService = {
      syncMenteeSessionsByEmail: vi.fn(),
    } as any;

    httpAdapter = {
      get: vi.fn(),
    } as any;

    service = new FetchSchedulesService(
      calendlyRepository,
      userRepository,
      refreshTokenService,
      mentorshipFeedbackRepository,
      syncMentorshipHistoryService,
      httpAdapter,
    );
  });

  it('should list the authenticated mentee schedules with reconciled scheduled events and persisted history', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      fullName: 'Mentorado',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).mockResolvedValue(undefined);
    vi.mocked(
      calendlyRepository.getConnectedCalendlySyncInfos,
    ).mockResolvedValue([
      {
        mentorId: 'mentor-1',
        calendlyUserUuid: 'mentor-calendly-1',
        calendlyAccessToken: 'mentor-token',
        accessTokenExpiration: null,
        mentor: {
          id: 'mentor-1',
          fullName: 'Mentora Agendada',
          email: 'mentor@example.com',
        },
      },
    ] as any);
    vi.mocked(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).mockResolvedValue({
      id: 'history-scheduled-1',
      calendlyEventUuid: 'upcoming-event-1',
      calendlyEventUri:
        'https://api.calendly.com/scheduled_events/upcoming-event-1',
      calendlyInviteeUri:
        'https://api.calendly.com/scheduled_events/upcoming-event-1/invitees/invitee-1',
      eventName: 'Mentoria agendada',
      description: 'Quero falar sobre carreira',
      startTime: '2099-06-12T18:00:00.000Z',
      endTime: '2099-06-12T18:30:00.000Z',
      duration: '30 minutes',
      joinUrl: 'https://meet.example.com/upcoming',
      cancelUrl: 'https://calendly.com/cancel/upcoming-event-1',
      rescheduleUrl: 'https://calendly.com/reschedule/upcoming-event-1',
    } as any);
    vi.mocked(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).mockResolvedValue([
      {
        id: 'history-scheduled-1',
        status: 'SCHEDULED',
        calendlyEventUuid: 'upcoming-event-1',
        calendlyEventUri:
          'https://api.calendly.com/scheduled_events/upcoming-event-1',
        calendlyInviteeUri:
          'https://api.calendly.com/scheduled_events/upcoming-event-1/invitees/invitee-1',
        eventName: 'Mentoria agendada',
        description: 'Quero falar sobre carreira',
        startTime: '2099-06-12T18:00:00.000Z',
        endTime: '2099-06-12T18:30:00.000Z',
        duration: '30 minutes',
        joinUrl: 'https://meet.example.com/upcoming',
        cancelUrl: 'https://calendly.com/cancel/upcoming-event-1',
        rescheduleUrl: 'https://calendly.com/reschedule/upcoming-event-1',
        mentors: {
          id: 'mentor-1',
          fullName: 'Mentora Agendada',
        },
      },
      {
        id: 'history-completed-1',
        status: 'COMPLETED',
        calendlyEventUuid: 'completed-event-1',
        calendlyEventUri:
          'https://api.calendly.com/scheduled_events/completed-event-1',
        eventName: 'Mentoria concluída',
        description: 'Retrospectiva',
        startTime: new Date('2026-06-10T18:00:00.000Z'),
        endTime: new Date('2026-06-10T18:45:00.000Z'),
        duration: '45 minutes',
        joinUrl: 'https://meet.example.com/completed',
        mentors: {
          id: 'mentor-2',
          fullName: 'Mentora Histórica',
        },
      },
    ] as any);

    vi.mocked(httpAdapter.get).mockImplementation(async (url) => {
      if (url.includes('/scheduled_events?')) {
        return {
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/upcoming-event-1',
              name: 'Mentoria agendada',
              description: 'Planejamento',
              start_time: '2099-06-12T18:00:00.000Z',
              end_time: '2099-06-12T18:30:00.000Z',
              location: {
                join_url: 'https://meet.example.com/upcoming',
              },
            },
          ],
        } as any;
      }

      if (url.includes('/invitees')) {
        return {
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/upcoming-event-1/invitees/invitee-1',
              name: 'Mentorado',
              email: 'mentee@example.com',
              cancel_url: 'https://calendly.com/cancel/upcoming-event-1',
              reschedule_url:
                'https://calendly.com/reschedule/upcoming-event-1',
              questions_and_answers: [
                {
                  question: 'O que deseja abordar?',
                  answer: 'Quero falar sobre carreira',
                },
              ],
            },
          ],
        } as any;
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await service.getMenteeSchedules({
      id: 'mentee-1',
      email: 'mentee@example.com',
    } as any);

    expect(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).toHaveBeenCalledWith('mentee@example.com');
    expect(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        mentor_id: 'mentor-1',
        mentee_id: 'mentee-1',
        status: 'SCHEDULED',
        calendlyEventUuid: 'upcoming-event-1',
      }),
    );
    expect(result).toEqual([
      {
        eventUuid: 'upcoming-event-1',
        eventUri: 'https://api.calendly.com/scheduled_events/upcoming-event-1',
        eventName: 'Mentoria agendada',
        description: 'Quero falar sobre carreira',
        startTime: '2099-06-12T18:00:00.000Z',
        endTime: '2099-06-12T18:30:00.000Z',
        duration: '30 minutes',
        joinUrl: 'https://meet.example.com/upcoming',
        eventUrl: 'https://calendly.com/reschedule/upcoming-event-1',
        cancelUrl: 'https://calendly.com/cancel/upcoming-event-1',
        rescheduleUrl: 'https://calendly.com/reschedule/upcoming-event-1',
        status: 'scheduled',
        mentor: {
          id: 'mentor-1',
          fullName: 'Mentora Agendada',
        },
      },
      {
        eventUuid: 'completed-event-1',
        eventUri: 'https://api.calendly.com/scheduled_events/completed-event-1',
        eventName: 'Mentoria concluída',
        description: 'Retrospectiva',
        startTime: new Date('2026-06-10T18:00:00.000Z'),
        endTime: new Date('2026-06-10T18:45:00.000Z'),
        duration: '45 minutes',
        joinUrl: 'https://meet.example.com/completed',
        eventUrl:
          'https://calendly.com/app/scheduled_events/user/me?period=past&uuid=completed-event-1',
        cancelUrl: '',
        rescheduleUrl: '',
        status: 'completed',
        mentor: {
          id: 'mentor-2',
          fullName: 'Mentora Histórica',
        },
      },
    ]);
  });

  it('should include pending internal schedules when Calendly confirmation has not happened yet', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).mockResolvedValue(undefined);
    vi.mocked(
      calendlyRepository.getConnectedCalendlySyncInfos,
    ).mockResolvedValue([]);
    vi.mocked(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).mockResolvedValue([
      {
        id: 'history-pending-1',
        status: 'PENDING',
        eventName: 'Mentoria',
        description: 'Aguardando confirmação',
        startTime: '2099-06-15T18:00:00.000Z',
        endTime: '2099-06-15T18:30:00.000Z',
        duration: '30 minutes',
        joinUrl: '',
        mentors: {
          id: 'mentor-1',
          fullName: 'Mentora Pending',
        },
      },
    ] as any);

    const result = await service.getMenteeSchedules({
      id: 'mentee-1',
      email: 'mentee@example.com',
    } as any);

    expect(result).toEqual([
      {
        eventUuid: 'history-pending-1',
        eventUri: '',
        eventName: 'Mentoria',
        description: 'Aguardando confirmação',
        startTime: '2099-06-15T18:00:00.000Z',
        endTime: '2099-06-15T18:30:00.000Z',
        duration: '30 minutes',
        joinUrl: '',
        eventUrl: '',
        cancelUrl: '',
        rescheduleUrl: '',
        status: 'pending',
        mentor: {
          id: 'mentor-1',
          fullName: 'Mentora Pending',
        },
      },
    ]);
  });

  it('should return an empty list when the mentee has no schedules', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).mockResolvedValue(undefined);
    vi.mocked(
      calendlyRepository.getConnectedCalendlySyncInfos,
    ).mockResolvedValue([]);
    vi.mocked(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).mockResolvedValue([]);

    const result = await service.getMenteeSchedules({
      id: 'mentee-1',
      email: 'mentee@example.com',
    } as any);

    expect(result).toEqual([]);
  });

  it('should keep the persisted history when one mentor Calendly connection fails', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      fullName: 'Mentorado',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).mockResolvedValue(undefined);
    vi.mocked(
      calendlyRepository.getConnectedCalendlySyncInfos,
    ).mockResolvedValue([
      {
        mentorId: 'mentor-failing',
        calendlyUserUuid: 'mentor-failing-uuid',
        calendlyAccessToken: 'failing-token',
        accessTokenExpiration: null,
        mentor: {
          id: 'mentor-failing',
          fullName: 'Mentor com falha',
          email: 'failing@example.com',
        },
      },
      {
        mentorId: 'mentor-working',
        calendlyUserUuid: 'mentor-working-uuid',
        calendlyAccessToken: 'working-token',
        accessTokenExpiration: null,
        mentor: {
          id: 'mentor-working',
          fullName: 'Mentora ok',
          email: 'working@example.com',
        },
      },
    ] as any);
    vi.mocked(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).mockResolvedValue({
      id: 'history-scheduled-1',
      calendlyEventUuid: 'upcoming-event-1',
      calendlyEventUri:
        'https://api.calendly.com/scheduled_events/upcoming-event-1',
      eventName: 'Mentoria futura',
      description: '',
      startTime: '2099-06-14T18:00:00.000Z',
      endTime: '2099-06-14T18:30:00.000Z',
      duration: '30 minutes',
      joinUrl: '',
      cancelUrl: '',
      rescheduleUrl: '',
    } as any);
    vi.mocked(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).mockResolvedValue([
      {
        id: 'history-completed-1',
        status: 'COMPLETED',
        calendlyEventUuid: 'completed-event-1',
        calendlyEventUri:
          'https://api.calendly.com/scheduled_events/completed-event-1',
        eventName: 'Mentoria concluída',
        description: '',
        startTime: new Date('2026-06-10T18:00:00.000Z'),
        endTime: new Date('2026-06-10T18:30:00.000Z'),
        duration: '30 minutes',
        joinUrl: '',
        mentors: {
          id: 'mentor-history',
          fullName: 'Mentor histórico',
        },
      },
    ] as any);

    vi.mocked(httpAdapter.get).mockImplementation(async (url, options: any) => {
      if (
        url.includes('/scheduled_events?') &&
        options?.headers?.Authorization === 'Bearer failing-token'
      ) {
        throw new Error('Calendly unavailable');
      }

      if (
        url.includes('/scheduled_events?') &&
        options?.headers?.Authorization === 'Bearer working-token'
      ) {
        return {
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/upcoming-event-1',
              name: 'Mentoria futura',
              description: '',
              start_time: '2099-06-14T18:00:00.000Z',
              end_time: '2099-06-14T18:30:00.000Z',
              location: {},
            },
          ],
        } as any;
      }

      if (url.includes('/invitees')) {
        return {
          collection: [
            {
              email: 'mentee@example.com',
              name: 'Mentorado',
              questions_and_answers: [],
            },
          ],
        } as any;
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await service.getMenteeSchedules({
      id: 'mentee-1',
      email: 'mentee@example.com',
    } as any);

    expect(result).toHaveLength(2);
    expect(result.map((schedule) => schedule.eventUuid)).toEqual([
      'upcoming-event-1',
      'completed-event-1',
    ]);
  });

  it('should deduplicate the same Calendly event returned by different mentor connections', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      fullName: 'Mentorado',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).mockResolvedValue(undefined);
    vi.mocked(
      calendlyRepository.getConnectedCalendlySyncInfos,
    ).mockResolvedValue([
      {
        mentorId: 'mentor-mike',
        calendlyUserUuid: 'shared-calendly-uuid',
        calendlyAccessToken: 'shared-token-1',
        accessTokenExpiration: null,
        mentor: {
          id: 'mentor-mike',
          fullName: 'Mike Baguncinha',
          email: 'mike@example.com',
        },
      },
      {
        mentorId: 'mentor-minelis',
        calendlyUserUuid: 'shared-calendly-uuid',
        calendlyAccessToken: 'shared-token-2',
        accessTokenExpiration: null,
        mentor: {
          id: 'mentor-minelis',
          fullName: 'Minelis',
          email: 'minelis@example.com',
        },
      },
    ] as any);
    vi.mocked(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).mockResolvedValue([
      {
        id: 'history-scheduled-1',
        status: 'SCHEDULED',
        calendlyEventUuid: 'shared-event-1',
        calendlyEventUri:
          'https://api.calendly.com/scheduled_events/shared-event-1',
        eventName: 'Vai tomando!',
        description: 'Me ensina liderança ai',
        startTime: '2099-06-12T13:00:00.000Z',
        endTime: '2099-06-12T13:30:00.000Z',
        duration: '30 minutes',
        joinUrl: '',
        cancelUrl: 'https://calendly.com/cancel/shared-event-1',
        rescheduleUrl: 'https://calendly.com/reschedule/shared-event-1',
        mentors: {
          id: 'mentor-mike',
          fullName: 'Mike Baguncinha',
        },
      },
    ] as any);
    vi.mocked(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).mockResolvedValue({
      id: 'history-scheduled-1',
      calendlyEventUuid: 'shared-event-1',
      calendlyEventUri:
        'https://api.calendly.com/scheduled_events/shared-event-1',
      eventName: 'Vai tomando!',
      description: 'Me ensina liderança ai',
      startTime: '2099-06-12T13:00:00.000Z',
      endTime: '2099-06-12T13:30:00.000Z',
      duration: '30 minutes',
      joinUrl: '',
      cancelUrl: 'https://calendly.com/cancel/shared-event-1',
      rescheduleUrl: 'https://calendly.com/reschedule/shared-event-1',
    } as any);

    vi.mocked(httpAdapter.get).mockImplementation(async (url) => {
      if (url.includes('/scheduled_events?')) {
        return {
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/shared-event-1',
              name: 'Vai tomando!',
              description: 'Vai tomando!',
              start_time: '2099-06-12T13:00:00.000Z',
              end_time: '2099-06-12T13:30:00.000Z',
              location: {},
            },
          ],
        } as any;
      }

      if (url.includes('/invitees')) {
        return {
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/shared-event-1/invitees/invitee-1',
              name: 'Mentorado',
              email: 'mentee@example.com',
              cancel_url: 'https://calendly.com/cancel/shared-event-1',
              reschedule_url: 'https://calendly.com/reschedule/shared-event-1',
              questions_and_answers: [
                {
                  question: 'O que deseja abordar?',
                  answer: 'Me ensina liderança ai',
                },
              ],
            },
          ],
        } as any;
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await service.getMenteeSchedules({
      id: 'mentee-1',
      email: 'mentee@example.com',
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        eventUuid: 'shared-event-1',
        eventUrl: 'https://calendly.com/reschedule/shared-event-1',
        mentor: {
          id: 'mentor-mike',
          fullName: 'Mike Baguncinha',
        },
      }),
    );
  });

  it('should block access when the active profile is not the mentee profile', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-actual',
      email: 'same@email.com',
      deleted: false,
    } as any);

    await expect(
      service.getMenteeSchedules({
        id: 'mentor-active',
        email: 'same@email.com',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      syncMentorshipHistoryService.syncMenteeSessionsByEmail,
    ).not.toHaveBeenCalled();
    expect(
      mentorshipFeedbackRepository.findMenteeScheduleHistory,
    ).not.toHaveBeenCalled();
  });
});
