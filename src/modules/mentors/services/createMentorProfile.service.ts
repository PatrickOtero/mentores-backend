import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginTypeEnum } from '../../auth/enums/login-type.enum';
import { UserEntity } from '../../user/entities/user.entity';
import { UserRepository } from '../../user/user.repository';
import { MentorEntity } from '../entities/mentor.entity';
import { MentorRepository } from '../repository/mentor.repository';

@Injectable()
export class CreateMentorProfileService {
  constructor(
    private readonly mentorRepository: MentorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(loggedEntity: UserEntity | MentorEntity) {
    const existingMentorProfile = await this.mentorRepository.findMentorByEmail(
      loggedEntity.email,
    );

    if (existingMentorProfile && !existingMentorProfile.deleted) {
      return {
        status: 200,
        data: this.removeSensitiveFields(existingMentorProfile),
      };
    }

    const sourceProfile =
      (await this.userRepository.findUserByEmail(loggedEntity.email)) ??
      (await this.mentorRepository.findMentorByEmail(loggedEntity.email));

    if (!sourceProfile) {
      throw new BadRequestException('Base profile not found');
    }

    if (existingMentorProfile?.deleted) {
      const canRestoreLegacyProfile =
        Boolean(existingMentorProfile.deactivatedAt) ||
        Boolean(existingMentorProfile.deactivatedDays);

      if (!canRestoreLegacyProfile) {
        throw new BadRequestException('Mentor profile has been deleted');
      }

      await this.mentorRepository.updateMentor(existingMentorProfile.id, {
        fullName: sourceProfile.fullName,
        dateOfBirth: sourceProfile.dateOfBirth,
        password: sourceProfile.password,
        emailConfirmed: sourceProfile.emailConfirmed,
        gender: sourceProfile.gender ?? '',
        aboutMe: existingMentorProfile.aboutMe ?? null,
        specialties: existingMentorProfile.specialties ?? [],
        role: existingMentorProfile.role ?? null,
        profile: existingMentorProfile.profile ?? null,
        profileKey: existingMentorProfile.profileKey ?? null,
        registerComplete: existingMentorProfile.registerComplete ?? false,
        deleted: false,
        isProfilePaused: false,
        deactivatedDays: 0,
        deactivatedAt: null,
        defaultProfile:
          existingMentorProfile.defaultProfile ??
          sourceProfile.defaultProfile ??
          LoginTypeEnum.USER,
      });

      const restoredMentorProfile =
        await this.mentorRepository.findMentorByEmail(loggedEntity.email);

      return {
        status: 200,
        data: this.removeSensitiveFields(restoredMentorProfile),
      };
    }

    const mentorProfile = await this.mentorRepository.createNewMentor({
      fullName: sourceProfile.fullName,
      dateOfBirth: sourceProfile.dateOfBirth,
      email: sourceProfile.email,
      password: sourceProfile.password,
      emailConfirmed: sourceProfile.emailConfirmed,
      gender: sourceProfile.gender ?? '',
      specialties: [],
      registerComplete: false,
      isProfilePaused: false,
      defaultProfile: sourceProfile.defaultProfile ?? LoginTypeEnum.USER,
    });

    return {
      status: 201,
      data: this.removeSensitiveFields(mentorProfile),
    };
  }

  private removeSensitiveFields(mentorProfile: MentorEntity) {
    delete mentorProfile.password;
    delete mentorProfile.code;
    delete mentorProfile.emailConfirmed;
    delete mentorProfile.deleted;
    delete mentorProfile.accessAttempt;

    return mentorProfile;
  }
}
