import { HttpException, HttpStatus } from '@nestjs/common';
import { InfoEntity } from '../../entity/info.entity';
import { AuthService } from '../../services/auth.service';
import { MentorRepository } from 'src/modules/mentors/repository/mentor.repository';
import { UserRepository } from 'src/modules/user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/modules/mails/mail.service';
import { LoginTypeEnum } from '../../enums/login-type.enum';
import { CalendlyRepository } from 'src/modules/calendly/repository/calendly.repository';
import { vi } from 'vitest';
import IHashAdapter from 'src/lib/adapter/hash/hashAdapterInterface';

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
    it('should allow a deleted account to log in during the grace period', async () => {
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
      vi.mocked(hashAdapter.compareHash).mockResolvedValue(true);
      vi.mocked(jwtService.sign).mockReturnValue('mocked-token' as never);
      vi.mocked(calendlyRepository.getCalendlyInfoByMentorId).mockResolvedValue(
        null,
      );

      const result = await authService.execute({
        email: mockInfo.email,
        password: 'Password@123',
        type: LoginTypeEnum.USER,
      });

      expect(mentorRepository.updateMentor).toHaveBeenCalledWith(
        mockInfo.id,
        expect.objectContaining({
          deleted: false,
          deactivatedDays: 0,
          deactivatedAt: null,
        }),
      );
      expect(result.data.token).toBe('mocked-token');
    });

    it('should not reactivate a deleted account after the grace period', async () => {
      const deactivatedAt = new Date();
      deactivatedAt.setDate(deactivatedAt.getDate() - 31);

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
        deactivatedAt,
      };

      vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
        mockInfo as any,
      );

      await expect(
        authService.execute({
          email: mockInfo.email,
          password: 'Password@123',
          type: LoginTypeEnum.USER,
        }),
      ).rejects.toThrow(
        new HttpException(
          { message: 'invalid e-mail or password' },
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(mentorRepository.updateMentor).not.toHaveBeenCalled();
    });
    
  });
});
