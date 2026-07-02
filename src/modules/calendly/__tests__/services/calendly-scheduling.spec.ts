import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IHttpAdapter } from 'src/lib/adapter/httpAdapterInterface';
import { MentorshipFeedbackRepository } from 'src/modules/mentorship-feedback/repository/mentorship-feedback.repository';
import { UserRepository } from 'src/modules/user/user.repository';
import { CalendlyRepository } from '../../repository/calendly.repository';
import { CalendlySchedulingService } from '../../services/calendly-scheduling.service';
import { RefreshTokenService } from '../../services/refresh-token.service';

describe('CalendlySchedulingService', () => {
  let service: CalendlySchedulingService;
  let calendlyRepository: CalendlyRepository;
  let userRepository: UserRepository;
  let mentorshipFeedbackRepository: MentorshipFeedbackRepository;
  let refreshTokenService: RefreshTokenService;
  let httpAdapter: IHttpAdapter;

  beforeEach(() => {
    calendlyRepository = {
      getCalendlyInfoByMentorId: vi.fn(),
    } as any;

    userRepository = {
      findUserByEmail: vi.fn(),
    } as any;

    mentorshipFeedbackRepository = {
      upsertHistorySession: vi.fn(),
    } as any;

    refreshTokenService = {
      execute: vi.fn(),
    } as any;

    httpAdapter = {
      get: vi.fn(),
    } as any;

    service = new CalendlySchedulingService(
      calendlyRepository,
      userRepository,
      mentorshipFeedbackRepository,
      refreshTokenService,
      httpAdapter,
    );
  });

  it('should create or update a pending internal schedule before redirecting to Calendly', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-1',
      fullName: 'Mentorado Teste',
      email: 'mentee@example.com',
      deleted: false,
    } as any);
    vi.mocked(calendlyRepository.getCalendlyInfoByMentorId).mockResolvedValue({
      mentorId: 'mentor-1',
      calendlyAccessToken: 'mentor-token',
      accessTokenExpiration: null,
      calendlyUserUuid: 'mentor-calendly-uuid',
      calendlyName: 'mentor-calendly',
      agendaName: 'mentoria-online',
    } as any);
    vi.mocked(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).mockResolvedValue({} as any);
    vi.mocked(httpAdapter.get).mockResolvedValue({
      collection: [
        {
          uri: 'https://api.calendly.com/event_types/event-type-1',
          name: 'Mentoria Online',
          duration: 30,
          scheduling_url:
            'https://calendly.com/mentor-calendly/mentoria-online',
          slug: 'mentoria-online',
        },
      ],
    } as any);

    const response = await service.createInvitee(
      'mentor-1',
      {
        id: 'mentee-1',
        fullName: 'Mentorado Teste',
        email: 'mentee@example.com',
      } as any,
      {
        startTime: '2099-06-12T18:00:00.000Z',
        schedulingUrl:
          'https://calendly.com/mentor-calendly/mentoria-online?month=2099-06&date=2099-06-12',
        timezone: 'America/Sao_Paulo',
        description: 'Quero conversar sobre transição de carreira',
      },
    );

    expect(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        mentor_id: 'mentor-1',
        mentee_id: 'mentee-1',
        status: 'PENDING',
        eventName: 'Mentoria Online',
        description: 'Quero conversar sobre transição de carreira',
        inviteeName: 'Mentorado Teste',
        inviteeEmail: 'mentee@example.com',
        startTime: '2099-06-12T18:00:00.000Z',
        timezone: 'America/Sao_Paulo',
        schedulingUrl:
          'https://calendly.com/mentor-calendly/mentoria-online?month=2099-06&date=2099-06-12',
        duration: '30 minutes',
      }),
    );
    expect(response.selectedStartTime).toBe('2099-06-12T18:00:00.000Z');
    expect(response.requiresCalendlyRedirect).toBe(true);
    expect(response.scheduled).toBe(false);
    expect(response.schedulingUrl).toContain('name=Mentorado+Teste');
    expect(response.schedulingUrl).toContain('email=mentee%40example.com');
    expect(response.schedulingUrl).toContain('timezone=America%2FSao_Paulo');
    expect(response.schedulingUrl).toContain(
      'a1=Quero+conversar+sobre+transi%C3%A7%C3%A3o+de+carreira',
    );
  });

  it('should block pending schedule creation when the active profile is not a mentee profile', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'mentee-actual',
      email: 'same@email.com',
      deleted: false,
    } as any);

    await expect(
      service.createInvitee(
        'mentor-1',
        {
          id: 'mentor-active',
          fullName: 'Perfil errado',
          email: 'same@email.com',
        } as any,
        {
          startTime: '2099-06-12T18:00:00.000Z',
          timezone: 'America/Sao_Paulo',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      mentorshipFeedbackRepository.upsertHistorySession,
    ).not.toHaveBeenCalled();
  });
});
