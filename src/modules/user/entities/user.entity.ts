export class UserEntity {
  id?: string;
  fullName: string;
  dateOfBirth: string | Date;
  password?: string;
  email: string;
  emailConfirmed?: boolean;
  aboutMe?: string;
  copiedAboutMeFromMentor?: boolean;
  gender?: string;
  specialties?: string[];
  registerComplete?: boolean;
  profileKey?: string;
  profile?: string;
  copiedProfileFromMentor?: boolean;
  defaultProfile?: string;
  accessAttempt?: number;
  code?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deleted?: boolean;
  deactivatedDays?: number;
  deactivatedAt?: string | Date;
}
