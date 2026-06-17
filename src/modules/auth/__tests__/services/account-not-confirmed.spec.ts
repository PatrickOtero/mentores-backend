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

  it('should resend the mentor confirmation flow for an unconfirmed mentor', async () => {
    const mockInfo: InfoEntity = {
      id: '1',
      email: 'mentor@example.com',
      password: 'hashed-password',
      emailConfirmed: false,
      dateOfBirth: '1990-01-01',
      fullName: 'Test Mentor',
      deleted: false,
      accessAttempt: 0,
    };

    try {
      await authService.infoConfirm(mockInfo, LoginTypeEnum.MENTOR);
      throw new Error('Expected an account not confirmed error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((error as HttpException).getResponse()).toEqual({
        code: AuthErrorCodeEnum.ACCOUNT_NOT_CONFIRMED,
        message:
          'Your account is not activated yet. Check your e-mail inbox for instructions',
      });
    }

    expect(mailService.mentorSendCreationConfirmation).toHaveBeenCalledWith(
      mockInfo,
    );
    expect(mailService.userSendCreationConfirmation).not.toHaveBeenCalled();
  });

  it('should resend the user confirmation flow for an unconfirmed user', async () => {
    const mockInfo: InfoEntity = {
      id: '2',
      email: 'user@example.com',
      password: 'hashed-password',
      emailConfirmed: false,
      dateOfBirth: '1994-04-10',
      fullName: 'Test User',
      deleted: false,
      accessAttempt: 0,
    };

    try {
      await authService.infoConfirm(mockInfo, LoginTypeEnum.USER);
      throw new Error('Expected an account not confirmed error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((error as HttpException).getResponse()).toEqual({
        code: AuthErrorCodeEnum.ACCOUNT_NOT_CONFIRMED,
        message:
          'Your account is not activated yet. Check your e-mail inbox for instructions',
      });
    }

    expect(mailService.userSendCreationConfirmation).toHaveBeenCalledWith(
      mockInfo,
    );
    expect(mailService.mentorSendCreationConfirmation).not.toHaveBeenCalled();
  });
});
