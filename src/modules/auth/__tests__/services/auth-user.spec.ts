import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  describe('execute', () => {
    it('should authenticate a mentor and return a typed token', async () => {
      const loginData: InfoLoginDto = {
        email: 'mentor@example.com',
        password: 'Password@123',
        type: LoginTypeEnum.MENTOR,
      };

      const mockInfo: InfoEntity = {
        id: '1',
        email: loginData.email,
        password: 'hashed-password',
        emailConfirmed: true,
        deleted: false,
        fullName: 'Test Mentor',
        dateOfBirth: '1990-01-01',
        specialties: ['Node.js'],
        accessAttempt: 2,
      };

      vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
        mockInfo as any,
      );
      vi.mocked(hashAdapter.compareHash).mockResolvedValue(true);
      vi.mocked(jwtService.sign).mockReturnValue('mocked-token' as never);
      vi.mocked(calendlyRepository.getCalendlyInfoByMentorId).mockResolvedValue(
        { calendlyName: 'mentor-calendly' } as any,
      );

      const result = await authService.execute(loginData);

      expect(mentorRepository.updateMentor).toHaveBeenCalledWith(
        mockInfo.id,
        expect.objectContaining({
          accessAttempt: 0,
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: loginData.email,
        type: LoginTypeEnum.MENTOR,
      });
      expect(result).toEqual({
        status: 200,
        data: {
          token: 'mocked-token',
          profileType: LoginTypeEnum.MENTOR,
          info: {
            id: mockInfo.id,
            email: mockInfo.email,
            fullName: mockInfo.fullName,
            dateOfBirth: mockInfo.dateOfBirth,
            specialties: mockInfo.specialties,
            calendlyName: 'mentor-calendly',
          },
        },
      });
    });

    it('should authenticate with the user profile when no type is provided and only the mentee profile is active', async () => {
      const loginData: InfoLoginDto = {
        email: 'user@example.com',
        password: 'Password@123',
      };

      const mockUserInfo: InfoEntity = {
        id: '2',
        email: loginData.email,
        password: 'hashed-password',
        emailConfirmed: true,
        deleted: false,
        fullName: 'Test User',
        dateOfBirth: '1998-02-12',
        specialties: ['QA'],
        accessAttempt: 0,
        defaultProfile: LoginTypeEnum.USER,
      };

      vi.mocked(mentorRepository.findMentorByEmail).mockResolvedValue(
        null as any,
      );
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(
        mockUserInfo as any,
      );
      vi.mocked(hashAdapter.compareHash).mockResolvedValue(true);
      vi.mocked(jwtService.sign).mockReturnValue('user-token' as never);

      const result = await authService.execute(loginData);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: loginData.email,
        type: LoginTypeEnum.USER,
      });
      expect(result).toEqual({
        status: 200,
        data: {
          token: 'user-token',
          profileType: LoginTypeEnum.USER,
          info: {
            id: mockUserInfo.id,
            email: mockUserInfo.email,
            fullName: mockUserInfo.fullName,
            dateOfBirth: mockUserInfo.dateOfBirth,
            specialties: mockUserInfo.specialties,
            calendlyName: '',
          },
        },
      });
    });
  });
});
