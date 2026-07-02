import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IHashAdapter from 'src/lib/adapter/hash/hashAdapterInterface';
import { CalendlyRepository } from 'src/modules/calendly/repository/calendly.repository';
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from 'src/modules/user/user.repository';
import { LoginTypeEnum } from '../../enums/login-type.enum';
import { AuthErrorCodeEnum } from '../../enums/auth-error-code.enum';
import { InfoEntity } from '../../entity/info.entity';
import { AuthService } from '../../services/auth.service';

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

  describe('infoConfirm', () => {
    it('should reject login for a deleted mentor profile immediately', async () => {
      const mockInfo: InfoEntity = {
        id: '1',
        email: 'mentor@example.com',
        password: 'hashedpassword',
        emailConfirmed: true,
        dateOfBirth: '1990-01-01',
        fullName: 'Test Mentor',
        deleted: true,
        accessAttempt: 0,
        deactivatedDays: 0,
        deactivatedAt: new Date(),
      };

      vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
        mockInfo as any,
      );

      await expect(
        authService.execute({
          email: mockInfo.email,
          password: 'Password@123',
          type: LoginTypeEnum.MENTOR,
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            code: AuthErrorCodeEnum.INVALID_CREDENTIALS,
            message: 'invalid e-mail or password',
          },
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(hashAdapter.compareHash).not.toHaveBeenCalled();
      expect(mentorRepository.updateMentor).not.toHaveBeenCalled();
    });

    it('should keep rejecting deleted profiles regardless of deactivation metadata', async () => {
      const mockInfo: InfoEntity = {
        id: '1',
        email: 'mentor@example.com',
        password: 'hashedpassword',
        emailConfirmed: true,
        dateOfBirth: '1990-01-01',
        fullName: 'Test Mentor',
        deleted: true,
        accessAttempt: 0,
        deactivatedDays: 45,
        deactivatedAt: null,
      };

      vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
        mockInfo as any,
      );

      await expect(
        authService.execute({
          email: mockInfo.email,
          password: 'Password@123',
          type: LoginTypeEnum.MENTOR,
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            code: AuthErrorCodeEnum.INVALID_CREDENTIALS,
            message: 'invalid e-mail or password',
          },
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(mentorRepository.updateMentor).not.toHaveBeenCalled();
    });
  });
});
