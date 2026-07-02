export class HistoryEntity {
  id?: string;
  mentor_id: string;
  mentee_id: string;
  status?: string;
  duration?: string;
  happened_at?: Date | string;
  eventName?: string;
  description?: string;
  joinUrl?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  timezone?: string;
  schedulingUrl?: string;
  inviteeName?: string;
  inviteeEmail?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  calendlyEventUri?: string;
  calendlyEventUuid?: string;
  calendlyInviteeUri?: string;
  feedbackRequestedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
