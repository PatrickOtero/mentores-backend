import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { handleError } from 'src/shared/utils/handle-error.util';
import { HistoryEntity } from 'src/modules/mentors/entities/history.entity';
import { MentorshipFeedbackEntity } from '../entity/mentorship-feedback.entity';

@Injectable()
export class MentorshipFeedbackRepository extends PrismaClient {
  private normalizeDateTime(value?: Date | string | null) {
    if (!value) {
      return undefined;
    }

    return value instanceof Date ? value : new Date(value);
  }

  async findLatestHistoryEndTimeByMentorId(mentorId: string) {
    return this.history
      .findFirst({
        where: {
          mentor_id: mentorId,
          endTime: {
            not: null,
          },
        },
        select: {
          endTime: true,
        },
        orderBy: {
          endTime: 'desc',
        },
      })
      .catch(handleError);
  }

  async upsertHistorySession(data: Partial<HistoryEntity>) {
    const sessionInclude = {
      mentors: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      users: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      mentorshipFeedback: true,
    } as const;

    const normalizedStartTime = this.normalizeDateTime(data.startTime);
    const normalizedEndTime = this.normalizeDateTime(data.endTime);

    const normalizedData = {
      ...data,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    };

    let existingSession = null;

    if (data.calendlyEventUri) {
      existingSession = await this.history
        .findUnique({
          where: {
            calendlyEventUri: data.calendlyEventUri,
          },
          select: {
            id: true,
          },
        })
        .catch(handleError);
    }

    if (
      !existingSession &&
      data.mentee_id &&
      data.mentor_id &&
      normalizedStartTime
    ) {
      existingSession = await this.history
        .findFirst({
          where: {
            mentee_id: data.mentee_id,
            mentor_id: data.mentor_id,
            startTime: normalizedStartTime,
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        .catch(handleError);
    }

    if (existingSession) {
      return this.history
        .update({
          where: {
            id: existingSession.id,
          },
          data: normalizedData as any,
          include: sessionInclude,
        })
        .catch(handleError);
    }

    return this.history
      .create({
        data: normalizedData as any,
        include: sessionInclude,
      })
      .catch(handleError);
  }

  async markFeedbackRequested(historyId: string, feedbackRequestedAt: Date) {
    return this.history
      .update({
        where: {
          id: historyId,
        },
        data: {
          feedbackRequestedAt,
        },
      })
      .catch(handleError);
  }

  async findMenteeSessionsWithFeedback(menteeId: string) {
    return this.history
      .findMany({
        where: {
          mentee_id: menteeId,
          endTime: {
            not: null,
          },
        },
        include: {
          mentors: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          mentorshipFeedback: true,
        },
        orderBy: {
          endTime: 'desc',
        },
      })
      .catch(handleError);
  }

  async findMenteeScheduleHistory(menteeId: string) {
    return this.history
      .findMany({
        where: {
          mentee_id: menteeId,
          startTime: {
            not: null,
          },
        },
        include: {
          mentors: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      })
      .catch(handleError);
  }

  async findMenteeSessionById(historyId: string, menteeId: string) {
    return this.history
      .findFirst({
        where: {
          id: historyId,
          mentee_id: menteeId,
        },
        include: {
          mentors: {
            select: {
              id: true,
              fullName: true,
              email: true,
              specialties: true,
            },
          },
          mentorshipFeedback: true,
        },
      })
      .catch(handleError);
  }

  async createFeedback(data: Partial<MentorshipFeedbackEntity>) {
    return this.mentorshipFeedback
      .create({
        data: data as any,
        include: {
          history: {
            include: {
              mentors: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      })
      .catch(handleError);
  }
}
