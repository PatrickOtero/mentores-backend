export class MentorshipFeedbackEntity {
  id?: string;
  history_id: string;
  mentor_id: string;
  mentee_id: string;
  mentoringRating: number;
  mentorClarityRating: number;
  mentorSupportRating: number;
  goalProgressRating: number;
  platformExperienceRating: number;
  comment?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
