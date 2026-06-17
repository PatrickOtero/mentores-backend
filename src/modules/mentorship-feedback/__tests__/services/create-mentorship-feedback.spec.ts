import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateMentorshipFeedbackService } from '../../services/create-mentorship-feedback.service';
import { MentorshipFeedbackRepository } from '../../repository/mentorship-feedback.repository';

describe('CreateMentorshipFeedbackService', () => {
  let service: CreateMentorshipFeedbackService;
  let repository: MentorshipFeedbackRepository;

  beforeEach(() => {
    repository = {
      findMenteeSessionById: vi.fn(),
      createFeedback: vi.fn(),
    } as any;

    service = new CreateMentorshipFeedbackService(repository);
  });

  it('should throw when the session does not exist', async () => {
    vi.mocked(repository.findMenteeSessionById).mockResolvedValue(null as any);

    await expect(
      service.execute({ id: 'mentee-id', email: 'mentee@example.com' } as any, {
        historyId: 'history-id',
        mentoringRating: 5,
        mentorClarityRating: 5,
        mentorSupportRating: 5,
        goalProgressRating: 5,
        platformExperienceRating: 5,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw when the mentorship has not finished yet', async () => {
    vi.mocked(repository.findMenteeSessionById).mockResolvedValue({
      id: 'history-id',
      mentor_id: 'mentor-id',
      mentee_id: 'mentee-id',
      endTime: new Date(Date.now() + 60_000),
      mentorshipFeedback: null,
    } as any);

    await expect(
      service.execute({ id: 'mentee-id', email: 'mentee@example.com' } as any, {
        historyId: 'history-id',
        mentoringRating: 5,
        mentorClarityRating: 5,
        mentorSupportRating: 5,
        goalProgressRating: 5,
        platformExperienceRating: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when feedback already exists for the session', async () => {
    vi.mocked(repository.findMenteeSessionById).mockResolvedValue({
      id: 'history-id',
      mentor_id: 'mentor-id',
      mentee_id: 'mentee-id',
      endTime: new Date(Date.now() - 60_000),
      mentorshipFeedback: {
        id: 'feedback-id',
      },
    } as any);

    await expect(
      service.execute({ id: 'mentee-id', email: 'mentee@example.com' } as any, {
        historyId: 'history-id',
        mentoringRating: 5,
        mentorClarityRating: 5,
        mentorSupportRating: 5,
        goalProgressRating: 5,
        platformExperienceRating: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should create feedback for a completed mentorship session', async () => {
    vi.mocked(repository.findMenteeSessionById).mockResolvedValue({
      id: 'history-id',
      mentor_id: 'mentor-id',
      mentee_id: 'mentee-id',
      endTime: new Date(Date.now() - 60_000),
      mentorshipFeedback: null,
    } as any);
    vi.mocked(repository.createFeedback).mockResolvedValue({
      id: 'feedback-id',
    } as any);

    const result = await service.execute(
      { id: 'mentee-id', email: 'mentee@example.com' } as any,
      {
        historyId: 'history-id',
        mentoringRating: 5,
        mentorClarityRating: 4,
        mentorSupportRating: 5,
        goalProgressRating: 4,
        platformExperienceRating: 5,
        comment: 'Excelente experiência',
      },
    );

    expect(repository.createFeedback).toHaveBeenCalledWith({
      history_id: 'history-id',
      mentor_id: 'mentor-id',
      mentee_id: 'mentee-id',
      mentoringRating: 5,
      mentorClarityRating: 4,
      mentorSupportRating: 5,
      goalProgressRating: 4,
      platformExperienceRating: 5,
      comment: 'Excelente experiência',
    });
    expect(result).toEqual({
      status: 201,
      data: {
        message: 'Feedback enviado com sucesso.',
        id: 'feedback-id',
      },
    });
  });
});
