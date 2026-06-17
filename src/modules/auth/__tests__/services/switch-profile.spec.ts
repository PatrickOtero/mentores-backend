import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from 'src/modules/user/user.repository';
import { CalendlyRepository } from 'src/modules/calendly/repository/calendly.repository';
import IHashAdapter from 'src/lib/adapter/hash/hashAdapterInterface';
import { AuthService } from '../../services/auth.service';
import { LoginTypeEnum } from '../../enums/login-type.enum';
import { InfoEntity } from '../../entity/info.entity';
import { AuthErrorCodeEnum } from '../../enums/auth-error-code.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let mentorRepository: MentorRepository;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let mailService: MailService;
  let calendlyRepository: CalendlyRepository;
  let hashAdapter: IHashAdapter;

  beforeEach(() => {
    mentorRepository = {
      findMentorByEmail: vi.fn(),
      updateMentor: vi.fn(),
    } as any;

    userRepository = {
      findUserByEmail: vi.fn(),
      updateUser: vi.fn(),
    } as any;

    jwtService = {
      sign: vi.fn(),
    } as any;

    mailService = {
      mentorSendCreationConfirmation: vi.fn(),
      userSendCreationConfirmation: vi.fn(),
    } as any;

    calendlyRepository = {
      getCalendlyInfoByMentorId: vi.fn(),
    } as any;

    hashAdapter = {
      compareHash: vi.fn(),
      createHash: vi.fn(),
    } as any;

    authService = new AuthService(
      calendlyRepository,
      mentorRepository,
      userRepository,
      jwtService,
      mailService,
      hashAdapter,
    );
  });

  it('should switch to the user profile and return a typed token', async () => {
    const mockInfo: InfoEntity = {
      id: '2',
      email: 'user@example.com',
      password: 'hashed-password',
      emailConfirmed: true,
      deleted: false,
      fullName: 'Test User',
      dateOfBirth: '1996-05-12',
      specialties: ['QA'],
      aboutMe: 'Looking for guidance',
      accessAttempt: 0,
    };

    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(
      mockInfo as any,
    );
    vi.mocked(jwtService.sign).mockReturnValue('user-token' as never);

    const result = await authService.switchProfile(
      mockInfo.email,
      LoginTypeEnum.USER,
    );

    expect(userRepository.findUserByEmail).toHaveBeenCalledWith(mockInfo.email);
    expect(calendlyRepository.getCalendlyInfoByMentorId).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: mockInfo.email,
      type: LoginTypeEnum.USER,
    });
    expect(result).toEqual({
      status: 200,
      data: {
        token: 'user-token',
        profileType: LoginTypeEnum.USER,
        info: {
          id: mockInfo.id,
          email: mockInfo.email,
          fullName: mockInfo.fullName,
          dateOfBirth: mockInfo.dateOfBirth,
          specialties: mockInfo.specialties,
          aboutMe: mockInfo.aboutMe,
          calendlyName: '',
        },
      },
    });
  });

  it('should return a stable profile-not-found code when the target profile does not exist', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null as any);

    try {
      await authService.switchProfile(
        'missing@example.com',
        LoginTypeEnum.USER,
      );
      throw new Error('Expected a profile not found error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((error as HttpException).getResponse()).toEqual({
        code: AuthErrorCodeEnum.PROFILE_NOT_FOUND,
        message: 'Profile not found',
      });
    }
  });

  it('should return a stable paused-profile code when trying to switch to a paused mentor profile', async () => {
    const pausedMentor: InfoEntity = {
      id: '1',
      email: 'mentor@example.com',
      password: 'hashed-password',
      emailConfirmed: true,
      deleted: false,
      fullName: 'Paused Mentor',
      dateOfBirth: '1990-01-01',
      aboutMe: 'Mentor profile',
      accessAttempt: 0,
      isProfilePaused: true,
    };

    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
      pausedMentor as any,
    );

    try {
      await authService.switchProfile(pausedMentor.email, LoginTypeEnum.MENTOR);
      throw new Error('Expected a paused profile error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect((error as HttpException).getResponse()).toEqual({
        code: AuthErrorCodeEnum.PROFILE_PAUSED,
        message: 'Mentor profile is paused',
      });
    }
  });
});
