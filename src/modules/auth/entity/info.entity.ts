export class InfoEntity {
  accessAttempt?: number;
  code?: string;
  createdAt?: string | Date;
  dateOfBirth: string | Date;
  deleted?: boolean;
  deactivatedDays?: number;
  deactivatedAt?: Date | null | string;
  aboutMe?: string;
  copiedAboutMeFromMentor?: boolean;
  gender?: string;
  email: string;
  emailConfirmed?: boolean;
  fullName: string;
  id?: string;
  password?: string;
  profile?: string;
  profileKey?: string;
  copiedProfileFromMentor?: boolean;
  defaultProfile?: string;
  isProfilePaused?: boolean;
  registerComplete?: boolean;
  specialties?: string[];
  updatedAt?: string | Date;
  calendlyName?: string;
}
