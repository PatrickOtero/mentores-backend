import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from '../../user.repository';
import { DiscardUserProfileDraftService } from '../../services/discardUserProfileDraft.service';

describe('DiscardUserProfileDraftService', () => {
  let service: DiscardUserProfileDraftService;
  let userRepository: UserRepository;
  let mentorRepository: MentorRepository;

  beforeEach(() => {
    userRepository = {
      findUserByEmail: vi.fn(),
      deleteUserById: vi.fn(),
    } as any;

    mentorRepository = {
      findMentorByEmail: vi.fn(),
    } as any;

    service = new DiscardUserProfileDraftService(
      userRepository,
      mentorRepository,
    );
  });

  it('should discard an incomplete secondary user profile draft', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      registerComplete: false,
      deleted: false,
    } as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue({
      id: 'mentor-id',
      email: 'person@example.com',
      deleted: false,
    } as any);

    const result = await service.execute('person@example.com');

    expect(userRepository.deleteUserById).toHaveBeenCalledWith('user-id');
    expect(result).toEqual({
      status: 200,
      data: {
        message: 'User profile draft discarded successfully',
      },
    });
  });

  it('should reject discarding a completed profile', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      registerComplete: true,
      deleted: false,
    } as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue({
      id: 'mentor-id',
      email: 'person@example.com',
      deleted: false,
    } as any);

    await expect(service.execute('person@example.com')).rejects.toThrow(
      new BadRequestException('Only incomplete user profiles can be discarded'),
    );
  });

  it('should reject discarding the first user profile flow', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      registerComplete: false,
      deleted: false,
    } as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
      null as any,
    );

    await expect(service.execute('person@example.com')).rejects.toThrow(
      new BadRequestException('Only secondary user profiles can be discarded'),
    );
  });
});
