import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../../modules/mails/mail.service';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { UserRepository } from '../../../modules/user/user.repository';
import { InfoLoginDto } from '../dtos/info-login.dto';
import { InfoEntity } from '../entity/info.entity';
import { MentorEntity } from '../../../modules/mentors/entities/mentor.entity';
import { UserEntity } from '../../../modules/user/entities/user.entity';
import { accessAttemptMessage } from '../enums/message.enum';

import IHashAdapter from 'src/lib/adapter/hash/hashAdapterInterface';
import { CalendlyRepository } from '../../../modules/calendly/repository/calendly.repository';
import { LoginTypeEnum } from '../enums/login-type.enum';
import { AuthErrorCodeEnum } from '../enums/auth-error-code.enum';

const INVALID_CREDENTIALS_MESSAGE = 'invalid e-mail or password';

@Injectable()
export class AuthService {
  constructor(
    private calendlyRepository: CalendlyRepository,
    private mentorRepository: MentorRepository,
    private userRepository: UserRepository,
    private jwt: JwtService,
    private mailService: MailService,
    @Inject('IHashAdapter') private readonly hashAdapter: IHashAdapter,
  ) {}

  async execute({ email, password, type: requestedType }: InfoLoginDto) {
    const type = await this.resolveLoginType(email, requestedType);
    const info = await this.findProfileByType(email, type);
    await this.infoConfirm(info, type);

    // const passwordIsValid = await bcrypt.compare(password, info.password); * Versão antiga
    const passwordIsValid = await this.hashAdapter.compareHash(
      password,
      info.password,
    );

    if (!passwordIsValid) {
      await this.invalidPassword(info, type);
    }

    info.accessAttempt = 0;

    const infoToUpdate = { ...info };

    await this.updateProfileByType(info.id as string, infoToUpdate, type);
    await this.attachCalendlyName(info, type);
    this.removeSensitiveFields(info);

    return {
      status: 200,
      data: {
        token: this.jwt.sign({ email, type }),
        info,
        profileType: type,
      },
    };
  }

  async switchProfile(email: string, requestedType: string) {
    const type = this.normalizeLoginType(requestedType);
    const info = await this.findProfileByType(email, type);

    if (!info || info.deleted) {
      this.throwAuthException(
        HttpStatus.NOT_FOUND,
        AuthErrorCodeEnum.PROFILE_NOT_FOUND,
        'Profile not found',
      );
    }

    if (type === LoginTypeEnum.MENTOR && info.isProfilePaused) {
      this.throwAuthException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        AuthErrorCodeEnum.PROFILE_PAUSED,
        'Mentor profile is paused',
      );
    }

    await this.syncDefaultProfile(email, type);
    await this.attachCalendlyName(info, type);
    this.removeSensitiveFields(info);

    return {
      status: 200,
      data: {
        token: this.jwt.sign({ email, type }),
        info,
        profileType: type,
      },
    };
  }

  async getProfiles(email: string) {
    const mentor = await this.mentorRepository.findMentorByEmail(email);
    const user = await this.userRepository.findUserByEmail(email);
    const defaultProfile =
      (!mentor?.deleted && mentor?.defaultProfile) ||
      (!user?.deleted && user?.defaultProfile) ||
      user?.defaultProfile ||
      mentor?.defaultProfile ||
      null;

    return {
      status: 200,
      data: {
        defaultProfile,
        mentor: {
          exists: Boolean(mentor && !mentor.deleted),
          paused: Boolean(mentor && !mentor.deleted && mentor.isProfilePaused),
          deleted: Boolean(mentor?.deleted),
          registerComplete: Boolean(
            mentor && !mentor.deleted && mentor.registerComplete,
          ),
        },
        mentee: {
          exists: Boolean(user && !user.deleted),
          paused: false,
          deleted: Boolean(user?.deleted),
          registerComplete: Boolean(
            user && !user.deleted && user.registerComplete,
          ),
        },
      },
    };
  }

  async infoConfirm(info: InfoEntity, type: LoginTypeEnum | string) {
    if (!info || info.deleted) {
      this.throwAuthException(
        HttpStatus.UNAUTHORIZED,
        AuthErrorCodeEnum.INVALID_CREDENTIALS,
        INVALID_CREDENTIALS_MESSAGE,
      );
    }

    if (!info.emailConfirmed) {
      const message =
        'Your account is not activated yet. Check your e-mail inbox for instructions';

      if (type === LoginTypeEnum.MENTOR) {
        await this.mailService.mentorSendCreationConfirmation(
          info as MentorEntity,
        );
      }

      if (type === LoginTypeEnum.USER) {
        await this.mailService.userSendCreationConfirmation(info as UserEntity);
      }

      this.throwAuthException(
        HttpStatus.NOT_FOUND,
        AuthErrorCodeEnum.ACCOUNT_NOT_CONFIRMED,
        message,
      );
    }

    return;
  }

  private async findProfileByType(
    email: string,
    type: LoginTypeEnum | string,
  ): Promise<InfoEntity> {
    if (type === LoginTypeEnum.MENTOR) {
      return this.mentorRepository.findMentorByEmail(email);
    }

    return this.userRepository.findUserByEmail(email);
  }

  private normalizeLoginType(type?: string): LoginTypeEnum {
    if (type === LoginTypeEnum.MENTOR) {
      return LoginTypeEnum.MENTOR;
    }

    if (type === 'mentee' || type === LoginTypeEnum.USER) {
      return LoginTypeEnum.USER;
    }

    return LoginTypeEnum.MENTOR;
  }

  private async resolveLoginType(
    email: string,
    requestedType?: string,
  ): Promise<LoginTypeEnum> {
    if (requestedType) {
      return this.normalizeLoginType(requestedType);
    }

    const mentor = await this.mentorRepository.findMentorByEmail(email);
    const user = await this.userRepository.findUserByEmail(email);

    const activeMentor = mentor && !mentor.deleted ? mentor : null;
    const activeUser = user && !user.deleted ? user : null;
    const defaultProfile =
      mentor?.defaultProfile ?? user?.defaultProfile ?? null;

    if (defaultProfile === LoginTypeEnum.USER && activeUser) {
      return LoginTypeEnum.USER;
    }

    if (defaultProfile === LoginTypeEnum.MENTOR && activeMentor) {
      return LoginTypeEnum.MENTOR;
    }

    if (activeMentor) {
      return LoginTypeEnum.MENTOR;
    }

    if (activeUser) {
      return LoginTypeEnum.USER;
    }

    return LoginTypeEnum.MENTOR;
  }

  private async syncDefaultProfile(
    email: string,
    type: LoginTypeEnum,
  ): Promise<void> {
    const mentor = await this.mentorRepository.findMentorByEmail(email);
    const user = await this.userRepository.findUserByEmail(email);

    if (mentor) {
      await this.mentorRepository.updateMentor(mentor.id, {
        defaultProfile: type,
      });
    }

    if (user) {
      await this.userRepository.updateUser(user.id, {
        defaultProfile: type,
      });
    }
  }

  private async updateProfileByType(
    id: string,
    info: InfoEntity,
    type: LoginTypeEnum | string,
  ) {
    if (type === LoginTypeEnum.MENTOR) {
      return this.mentorRepository.updateMentor(id, info);
    }

    return this.userRepository.updateUser(id, info);
  }

  private async attachCalendlyName(
    info: InfoEntity,
    type: LoginTypeEnum | string,
  ) {
    if (type !== LoginTypeEnum.MENTOR) {
      info.calendlyName = '';
      return;
    }

    const calendlyMentorData =
      await this.calendlyRepository.getCalendlyInfoByMentorId(
        info.id as string,
      );

    info.calendlyName = calendlyMentorData?.calendlyName ?? '';
  }

  private removeSensitiveFields(info: InfoEntity) {
    delete info.password;
    delete info.code;
    delete info.emailConfirmed;
    delete info.deleted;
    delete info.accessAttempt;
    delete info.defaultProfile;
  }

  async invalidPassword(info: InfoEntity, type: LoginTypeEnum | string) {
    const accessAttempt = info.accessAttempt;

    if (accessAttempt < 5) {
      info.accessAttempt += 1;
      if (type === LoginTypeEnum.MENTOR) {
        await this.mentorRepository.updateMentor(info.id, info);
      } else {
        await this.userRepository.updateUser(info.id, info);
      }
    }

    const message = accessAttemptMessage[accessAttempt + 1];

    if (message) {
      const code =
        accessAttempt + 1 >= 5
          ? AuthErrorCodeEnum.ACCOUNT_BLOCKED
          : AuthErrorCodeEnum.PASSWORD_ATTEMPT_WARNING;

      this.throwAuthException(HttpStatus.NOT_FOUND, code, message);
    }

    this.throwAuthException(
      HttpStatus.UNAUTHORIZED,
      AuthErrorCodeEnum.INVALID_CREDENTIALS,
      INVALID_CREDENTIALS_MESSAGE,
    );
  }

  private throwAuthException(
    status: HttpStatus,
    code: AuthErrorCodeEnum,
    message: string,
  ): never {
    throw new HttpException({ code, message }, status);
  }
}
