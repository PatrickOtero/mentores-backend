import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { CreateUserProfileService } from '../../services/createUserProfile.service';
import { UserRepository } from '../../user.repository';
import { MentorEntity } from 'src/modules/mentors/entities/mentor.entity';
import { UserEntity } from '../../entities/user.entity';

describe('CreateUserProfileService', () => {
  let service: CreateUserProfileService;
  let userRepository: UserRepository;
  let mentorRepository: MentorRepository;

  beforeEach(() => {
    userRepository = {
      findUserByEmail: vi.fn(),
      createUserProfile: vi.fn(),
    } as any;

    mentorRepository = {
      findMentorByEmail: vi.fn(),
    } as any;

    service = new CreateUserProfileService(userRepository, mentorRepository);
  });

  it('should return the existing user profile when it already exists', async () => {
    const loggedEntity = {
      email: 'mentor@example.com',
    } as MentorEntity;

    const existingUser: UserEntity = {
      id: '2',
      fullName: 'Existing User',
      email: 'mentor@example.com',
      dateOfBirth: '1999-01-01',
      specialties: ['Front-End'],
    };

    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(existingUser);

    const result = await service.execute(loggedEntity, {});

    expect(userRepository.createUserProfile).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 200,
      data: existingUser,
    });
  });

  it('should create a user profile from the mentor data when none exists', async () => {
    const loggedEntity = {
      email: 'mentor@example.com',
    } as MentorEntity;

    const mentorProfile = {
      id: '1',
      fullName: 'Mentor Name',
      email: 'mentor@example.com',
      dateOfBirth: new Date('1990-01-01'),
      password: 'hashed-password',
      emailConfirmed: true,
      gender: 'Feminino',
    } as MentorEntity;

    const createdUser = {
      id: '2',
      fullName: 'Mentor Name',
      email: 'mentor@example.com',
      dateOfBirth: new Date('1990-01-01'),
      specialties: ['Back-End'],
      aboutMe: 'Quero aprender mais',
      gender: 'Feminino',
      registerComplete: true,
    } as UserEntity;

    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
      mentorProfile,
    );
    vi.mocked(userRepository.createUserProfile).mockResolvedValue(createdUser);

    const result = await service.execute(loggedEntity, {
      specialties: ['Back-End'],
      aboutMe: 'Quero aprender mais',
      registerComplete: true,
    });

    expect(userRepository.createUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: mentorProfile.fullName,
        email: mentorProfile.email,
        specialties: ['Back-End'],
        aboutMe: 'Quero aprender mais',
        registerComplete: true,
      }),
    );
    expect(result).toEqual({
      status: 201,
      data: createdUser,
    });
  });

  it('should throw when the mentor base profile does not exist', async () => {
    const loggedEntity = {
      email: 'missing@example.com',
    } as MentorEntity;

    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null as any);
    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
      null as any,
    );

    await expect(service.execute(loggedEntity, {})).rejects.toThrow(
      new BadRequestException('Mentor profile not found'),
    );
  });
});
