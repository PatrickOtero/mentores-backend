import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { MentorshipFeedbackRepository } from '../repository/mentorship-feedback.repository';
import { SyncMentorshipHistoryService } from './sync-mentorship-history.service';

@Injectable()
export class GetMenteeFeedbackSessionService {
  constructor(
    private readonly mentorshipFeedbackRepository: MentorshipFeedbackRepository,
    private readonly syncMentorshipHistoryService: SyncMentorshipHistoryService,
  ) {}

  async execute(historyId: string, loggedUser: UserEntity) {
    await this.syncMentorshipHistoryService.syncMenteeSessionsByEmail(
      loggedUser.email,
    );

    const session =
      await this.mentorshipFeedbackRepository.findMenteeSessionById(
        historyId,
        loggedUser.id as string,
      );

    if (!session) {
      throw new NotFoundException('Sessão de mentoria não encontrada.');
    }

    return {
      historyId: session.id,
      mentor: {
        id: session.mentors.id,
        fullName: session.mentors.fullName,
        specialties: session.mentors.specialties,
      },
      eventName: session.eventName || 'Mentoria',
      description: session.description || '',
      joinUrl: session.joinUrl || '',
      inviteeName: session.inviteeName || '',
      sessionStartTime: session.startTime,
      sessionEndTime: session.endTime,
      duration: session.duration,
      submittedAt: session.mentorshipFeedback?.createdAt || null,
      feedback: session.mentorshipFeedback
        ? {
            id: session.mentorshipFeedback.id,
            mentoringRating: session.mentorshipFeedback.mentoringRating,
            mentorClarityRating: session.mentorshipFeedback.mentorClarityRating,
            mentorSupportRating: session.mentorshipFeedback.mentorSupportRating,
            goalProgressRating: session.mentorshipFeedback.goalProgressRating,
            platformExperienceRating:
              session.mentorshipFeedback.platformExperienceRating,
            comment: session.mentorshipFeedback.comment,
          }
        : null,
    };
  }
}
