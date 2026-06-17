import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CreateMentorshipFeedbackDto } from '../dto/create-mentorship-feedback.dto';
import { MentorshipFeedbackRepository } from '../repository/mentorship-feedback.repository';

@Injectable()
export class CreateMentorshipFeedbackService {
  constructor(
    private readonly mentorshipFeedbackRepository: MentorshipFeedbackRepository,
  ) {}

  async execute(loggedUser: UserEntity, data: CreateMentorshipFeedbackDto) {
    const session =
      await this.mentorshipFeedbackRepository.findMenteeSessionById(
        data.historyId,
        loggedUser.id as string,
      );

    if (!session) {
      throw new NotFoundException('Sessão de mentoria não encontrada.');
    }

    if (!session.endTime || new Date(session.endTime) > new Date()) {
      throw new BadRequestException(
        'O feedback só pode ser enviado após o encerramento da mentoria.',
      );
    }

    if (session.mentorshipFeedback) {
      throw new ConflictException(
        'Já existe um feedback cadastrado para esta mentoria.',
      );
    }

    const feedback = await this.mentorshipFeedbackRepository.createFeedback({
      history_id: session.id,
      mentor_id: session.mentor_id,
      mentee_id: session.mentee_id,
      mentoringRating: data.mentoringRating,
      mentorClarityRating: data.mentorClarityRating,
      mentorSupportRating: data.mentorSupportRating,
      goalProgressRating: data.goalProgressRating,
      platformExperienceRating: data.platformExperienceRating,
      comment: data.comment?.trim() || undefined,
    });

    return {
      status: 201,
      data: {
        message: 'Feedback enviado com sucesso.',
        id: feedback.id,
      },
    };
  }
}
