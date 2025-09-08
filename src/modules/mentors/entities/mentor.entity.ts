export class MentorEntity {
  id?: string;
  fullName: string;
  dateOfBirth: string | Date;
  password?: string;
  email: string;
  emailConfirmed?: boolean;
  specialties?: string[];
  role?: string;
  gender?: string;
  aboutMe?: string;
  registerComplete?: boolean;
  profileKey?: string;
  profile?: string;
  accessAttempt?: number;
  code?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deleted?: boolean;
<<<<<<< HEAD
=======
  deactivatedDays?: number;
>>>>>>> 092092cf4f70d6a9ee0b7a315dca72df6c80b3ee
}
