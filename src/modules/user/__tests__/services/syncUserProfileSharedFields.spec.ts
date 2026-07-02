import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { SyncUserProfileSharedFieldsService } from '../../services/syncUserProfileSharedFields.service';
import { UserRepository } from '../../user.repository';

describe('SyncUserProfileSharedFieldsService', () => {
  let service: SyncUserProfileSharedFieldsService;
  let userRepository: UserRepository;
  let mentorRepository: MentorRepository;

  beforeEach(() => {
    userRepository = {
      findUserByEmail: vi.fn(),
      updateUser: vi.fn(),
    } as any;

    mentorRepository = {
      findMentorByEmail: vi.fn(),
      updateMentor: vi.fn(),
    } as any;

    service = new SyncUserProfileSharedFieldsService(
      userRepository,
      mentorRepository,
    );
  });

  it('should sync shared aboutMe and profile fields', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      deleted: false,
    } as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue({
      id: 'mentor-id',
      email: 'person@example.com',
      deleted: false,
    } as any);

    const result = await service.execute('person@example.com', {
      aboutMe: 'Nova bio',
      profile: 'https://image.example/profile.png',
      syncAboutMe: true,
      syncProfile: true,
    });

    expect(mentorRepository.updateMentor).toHaveBeenCalledWith('mentor-id', {
      aboutMe: 'Nova bio',
      profile: 'https://image.example/profile.png',
    });
    expect(userRepository.updateUser).toHaveBeenCalledWith('user-id', {
      copiedAboutMeFromMentor: true,
      copiedProfileFromMentor: true,
    });
    expect(result).toEqual({
      status: 200,
      data: {
        message: 'Shared profile fields synchronized successfully',
      },
    });
  });

  it('should reject when no shared field is selected', async () => {
    await expect(service.execute('person@example.com', {})).rejects.toThrow(
      new BadRequestException('At least one shared field must be selected'),
    );
  });
});
