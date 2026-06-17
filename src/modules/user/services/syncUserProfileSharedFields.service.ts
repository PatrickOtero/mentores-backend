import { BadRequestException, Injectable } from '@nestjs/common';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { UserRepository } from '../user.repository';
import { SyncUserProfileSharedFieldsDto } from '../dto/sync-user-profile-shared-fields.dto';

@Injectable()
export class SyncUserProfileSharedFieldsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mentorRepository: MentorRepository,
  ) {}

  async execute(email: string, data: SyncUserProfileSharedFieldsDto) {
    if (!data.syncAboutMe && !data.syncProfile) {
      throw new BadRequestException(
        'At least one shared field must be selected',
      );
    }

    if (data.syncAboutMe && data.aboutMe === undefined) {
      throw new BadRequestException(
        'aboutMe is required when syncAboutMe is enabled',
      );
    }

    if (data.syncProfile && data.profile === undefined) {
      throw new BadRequestException(
        'profile is required when syncProfile is enabled',
      );
    }

    const [userProfile, mentorProfile] = await Promise.all([
      this.userRepository.findUserByEmail(email),
      this.mentorRepository.findMentorByEmail(email),
    ]);

    if (!userProfile || userProfile.deleted) {
      throw new BadRequestException('User profile not found');
    }

    if (!mentorProfile || mentorProfile.deleted) {
      throw new BadRequestException('Mentor profile not found');
    }

    const mentorUpdate: Record<string, any> = {};
    const userUpdate: Record<string, any> = {};

    if (data.syncAboutMe) {
      mentorUpdate.aboutMe = data.aboutMe;
      userUpdate.copiedAboutMeFromMentor = true;
    }

    if (data.syncProfile) {
      mentorUpdate.profile = data.profile;

      if (data.profileKey !== undefined) {
        mentorUpdate.profileKey = data.profileKey;
      }

      userUpdate.copiedProfileFromMentor = true;
    }

    await Promise.all([
      this.mentorRepository.updateMentor(mentorProfile.id, mentorUpdate),
      this.userRepository.updateUser(userProfile.id, userUpdate),
    ]);

    return {
      status: 200,
      data: {
        message: 'Shared profile fields synchronized successfully',
      },
    };
  }
}
