import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { MentorshipFeedbackRepository } from '../repository/mentorship-feedback.repository';
import { SyncMentorshipHistoryService } from './sync-mentorship-history.service';

@Injectable()
export class ListMenteeFeedbackService {
  constructor(
    private readonly mentorshipFeedbackRepository: MentorshipFeedbackRepository,
    private readonly syncMentorshipHistoryService: SyncMentorshipHistoryService,
  ) {}

  async execute(loggedUser: UserEntity) {
    await this.syncMentorshipHistoryService.syncMenteeSessionsByEmail(
      loggedUser.email,
    );

    const sessions =
      await this.mentorshipFeedbackRepository.findMenteeSessionsWithFeedback(
        loggedUser.id as string,
      );

    const pending = sessions
      .filter((session) => !session.mentorshipFeedback)
      .map((session) => ({
        historyId: session.id,
        mentorId: session.mentors.id,
        mentorName: session.mentors.fullName,
        eventName: session.eventName || 'Mentoria',
        sessionDate: session.endTime || session.startTime,
        duration: session.duration,
      }));

    const completed = sessions
      .filter((session) => session.mentorshipFeedback)
      .map((session) => ({
        historyId: session.id,
        mentorId: session.mentors.id,
        mentorName: session.mentors.fullName,
        eventName: session.eventName || 'Mentoria',
        sessionDate: session.endTime || session.startTime,
        duration: session.duration,
        feedback: {
          id: session.mentorshipFeedback.id,
          mentoringRating: session.mentorshipFeedback.mentoringRating,
          mentorClarityRating: session.mentorshipFeedback.mentorClarityRating,
          mentorSupportRating: session.mentorshipFeedback.mentorSupportRating,
          goalProgressRating: session.mentorshipFeedback.goalProgressRating,
          platformExperienceRating:
            session.mentorshipFeedback.platformExperienceRating,
          comment: session.mentorshipFeedback.comment,
          createdAt: session.mentorshipFeedback.createdAt,
        },
      }));

    return {
      pending,
      completed,
    };
  }
}
