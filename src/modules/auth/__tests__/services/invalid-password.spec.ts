import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from 'src/modules/user/user.repository';
import { CalendlyRepository } from 'src/modules/calendly/repository/calendly.repository';
import IHashAdapter from 'src/lib/adapter/hash/hashAdapterInterface';
import { AuthService } from '../../services/auth.service';
import { InfoLoginDto } from '../../dtos/info-login.dto';
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

  it('should throw invalid credentials with a stable error code', async () => {
    const loginData: InfoLoginDto = {
      email: 'mentor@example.com',
      password: 'wrong-password',
      type: LoginTypeEnum.MENTOR,
    };

    const mockInfo: InfoEntity = {
      id: '1',
      email: loginData.email,
      password: 'hashed-password',
      emailConfirmed: true,
      deleted: false,
      dateOfBirth: '1990-01-01',
      fullName: 'Test Mentor',
      accessAttempt: 0,
    };

    vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
      mockInfo as any,
    );
    vi.mocked(hashAdapter.compareHash).mockResolvedValue(false);

    try {
      await authService.execute(loginData);
      throw new Error('Expected an invalid credentials error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((error as HttpException).getResponse()).toEqual({
        code: AuthErrorCodeEnum.INVALID_CREDENTIALS,
        message: 'invalid e-mail or password',
      });
    }

    expect(mentorRepository.updateMentor).toHaveBeenCalledWith(mockInfo.id, {
      ...mockInfo,
      accessAttempt: 1,
    });
  });
});
