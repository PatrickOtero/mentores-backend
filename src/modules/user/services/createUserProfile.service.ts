import { BadRequestException, Injectable } from '@nestjs/common';
import { MentorEntity } from '../../../modules/mentors/entities/mentor.entity';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../user.repository';
import { LoginTypeEnum } from '../../auth/enums/login-type.enum';

@Injectable()
export class CreateUserProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mentorRepository: MentorRepository,
  ) {}

  async execute(loggedEntity: MentorEntity, data: CreateUserProfileDto) {
    const existingUserProfile = await this.userRepository.findUserByEmail(
      loggedEntity.email,
    );

    if (existingUserProfile) {
      if (existingUserProfile.deleted) {
        const canRestoreLegacyProfile =
          Boolean(existingUserProfile.deactivatedAt) ||
          Boolean(existingUserProfile.deactivatedDays);

        if (!canRestoreLegacyProfile) {
          throw new BadRequestException('User profile has been deleted');
        }

        await this.userRepository.updateUser(existingUserProfile.id, {
          fullName: loggedEntity.fullName,
          dateOfBirth: loggedEntity.dateOfBirth,
          password: loggedEntity.password,
          emailConfirmed: loggedEntity.emailConfirmed,
          gender: data.gender ?? loggedEntity.gender ?? '',
          aboutMe: existingUserProfile.aboutMe ?? null,
          copiedAboutMeFromMentor:
            data.copiedAboutMeFromMentor ??
            existingUserProfile.copiedAboutMeFromMentor ??
            false,
          specialties: existingUserProfile.specialties ?? [],
          profile: existingUserProfile.profile ?? null,
          profileKey: existingUserProfile.profileKey ?? null,
          copiedProfileFromMentor:
            data.copiedProfileFromMentor ??
            existingUserProfile.copiedProfileFromMentor ??
            false,
          registerComplete: existingUserProfile.registerComplete ?? false,
          deleted: false,
          deactivatedDays: 0,
          deactivatedAt: null,
          defaultProfile:
            existingUserProfile.defaultProfile ??
            loggedEntity.defaultProfile ??
            LoginTypeEnum.MENTOR,
        });

        const restoredUserProfile = await this.userRepository.findUserByEmail(
          loggedEntity.email,
        );

        return {
          status: 200,
          data: this.removeSensitiveFields(restoredUserProfile),
        };
      }

      return {
        status: 200,
        data: this.removeSensitiveFields(existingUserProfile),
      };
    }

    const mentorProfile = await this.mentorRepository.findMentorByEmail(
      loggedEntity.email,
    );

    if (!mentorProfile) {
      throw new BadRequestException('Mentor profile not found');
    }

    const userProfile = await this.userRepository.createUserProfile({
      fullName: mentorProfile.fullName,
      dateOfBirth: mentorProfile.dateOfBirth,
      email: mentorProfile.email,
      password: mentorProfile.password,
      emailConfirmed: mentorProfile.emailConfirmed,
      gender: data.gender ?? mentorProfile.gender,
      aboutMe: data.aboutMe ?? null,
      copiedAboutMeFromMentor: data.copiedAboutMeFromMentor ?? false,
      specialties: data.specialties ?? [],
      profile: data.profile ?? null,
      profileKey: data.profileKey ?? null,
      copiedProfileFromMentor: data.copiedProfileFromMentor ?? false,
      registerComplete: data.registerComplete ?? false,
      defaultProfile: mentorProfile.defaultProfile ?? LoginTypeEnum.MENTOR,
    });

    return {
      status: 201,
      data: this.removeSensitiveFields(userProfile),
    };
  }

  private removeSensitiveFields(userProfile: UserEntity) {
    delete userProfile.password;
    delete userProfile.code;
    delete userProfile.emailConfirmed;
    delete userProfile.deleted;
    delete userProfile.accessAttempt;

    return userProfile;
  }
}
