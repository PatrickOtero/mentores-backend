import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorshipFeedbackRepository } from '../../repository/mentorship-feedback.repository';
import { ListMenteeFeedbackService } from '../../services/list-mentee-feedback.service';
import { SyncMentorshipHistoryService } from '../../services/sync-mentorship-history.service';

describe('ListMenteeFeedbackService', () => {
  let service: ListMenteeFeedbackService;
  let repository: MentorshipFeedbackRepository;
  let syncService: SyncMentorshipHistoryService;

  beforeEach(() => {
    repository = {
      findMenteeSessionsWithFeedback: vi.fn(),
    } as any;

    syncService = {
      syncMenteeSessionsByEmail: vi.fn(),
    } as any;

    service = new ListMenteeFeedbackService(repository, syncService);
  });

  it('should list pending and completed feedback sessions for the mentee', async () => {
    vi.mocked(repository.findMenteeSessionsWithFeedback).mockResolvedValue([
      {
        id: 'pending-history',
        duration: '30 minutes',
        eventName: 'Mentoria de carreira',
        endTime: new Date('2026-06-10T18:00:00.000Z'),
        mentors: {
          id: 'mentor-1',
          fullName: 'Mentora Pending',
        },
        mentorshipFeedback: null,
      },
      {
        id: 'completed-history',
        duration: '45 minutes',
        eventName: 'Mentoria técnica',
        endTime: new Date('2026-06-08T18:00:00.000Z'),
        mentors: {
          id: 'mentor-2',
          fullName: 'Mentora Completed',
        },
        mentorshipFeedback: {
          id: 'feedback-id',
          mentoringRating: 5,
          mentorClarityRating: 4,
          mentorSupportRating: 5,
          goalProgressRating: 4,
          platformExperienceRating: 5,
          comment: 'Muito boa',
          createdAt: new Date('2026-06-09T12:00:00.000Z'),
        },
      },
    ] as any);

    const result = await service.execute({
      id: 'mentee-id',
      email: 'mentee@example.com',
    } as any);

    expect(syncService.syncMenteeSessionsByEmail).toHaveBeenCalledWith(
      'mentee@example.com',
    );
    expect(result).toEqual({
      pending: [
        {
          historyId: 'pending-history',
          mentorId: 'mentor-1',
          mentorName: 'Mentora Pending',
          eventName: 'Mentoria de carreira',
          sessionDate: new Date('2026-06-10T18:00:00.000Z'),
          duration: '30 minutes',
        },
      ],
      completed: [
        {
          historyId: 'completed-history',
          mentorId: 'mentor-2',
          mentorName: 'Mentora Completed',
          eventName: 'Mentoria técnica',
          sessionDate: new Date('2026-06-08T18:00:00.000Z'),
          duration: '45 minutes',
          feedback: {
            id: 'feedback-id',
            mentoringRating: 5,
            mentorClarityRating: 4,
            mentorSupportRating: 5,
            goalProgressRating: 4,
            platformExperienceRating: 5,
            comment: 'Muito boa',
            createdAt: new Date('2026-06-09T12:00:00.000Z'),
          },
        },
      ],
    });
  });
});
