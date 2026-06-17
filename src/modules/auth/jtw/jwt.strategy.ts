import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MentorRepository } from '../../../modules/mentors/repository/mentor.repository';
import { UserRepository } from '../../../modules/user/user.repository';
import { handleError } from '../../../shared/utils/handle-error.util';
import { LoginTypeEnum } from '../enums/login-type.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly mentorRepository: MentorRepository,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY,
    });
  }

  async validate(payload: { email: string; type?: LoginTypeEnum }) {
    if (payload.type === LoginTypeEnum.MENTOR) {
      const mentor = await this.mentorRepository
        .findMentorByEmail(payload.email)
        .catch(handleError);

      if (!mentor || mentor.deleted) {
        throw new UnauthorizedException('User not found or not authorized!');
      }

      delete mentor.password;
      return mentor;
    }

    if (payload.type === LoginTypeEnum.USER) {
      const user = await this.userRepository
        .findUserByEmail(payload.email)
        .catch(handleError);

      if (!user || user.deleted) {
        throw new UnauthorizedException('User not found or not authorized!');
      }

      delete user.password;
      return user;
    }

    const mentor = await this.mentorRepository
      .findMentorByEmail(payload.email)
      .catch(handleError);

    const user = await this.userRepository
      .findUserByEmail(payload.email)
      .catch(handleError);

    const activeMentor = mentor && !mentor.deleted ? mentor : null;
    const activeUser = user && !user.deleted ? user : null;

    if (!activeMentor && !activeUser) {
      throw new UnauthorizedException('User not found or not authorized!');
    }

    if (activeMentor) {
      delete activeMentor.password;
      return activeMentor;
    }

    delete activeUser.password;
    return activeUser;
  }
}
