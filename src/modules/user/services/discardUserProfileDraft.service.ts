import { BadRequestException, Injectable } from '@nestjs/common';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { UserRepository } from '../user.repository';

@Injectable()
export class DiscardUserProfileDraftService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mentorRepository: MentorRepository,
  ) {}

  async execute(email: string) {
    const [userProfile, mentorProfile] = await Promise.all([
      this.userRepository.findUserByEmail(email),
      this.mentorRepository.findMentorByEmail(email),
    ]);

    if (!userProfile || userProfile.deleted) {
      throw new BadRequestException('User profile draft not found');
    }

    if (userProfile.registerComplete) {
      throw new BadRequestException(
        'Only incomplete user profiles can be discarded',
      );
    }

    if (!mentorProfile || mentorProfile.deleted) {
      throw new BadRequestException(
        'Only secondary user profiles can be discarded',
      );
    }

    await this.userRepository.deleteUserById(userProfile.id);

    return {
      status: 200,
      data: {
        message: 'User profile draft discarded successfully',
      },
    };
  }
}
