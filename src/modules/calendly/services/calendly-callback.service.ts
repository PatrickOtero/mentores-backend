import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { IHttpAdapter } from '../../../lib/adapter/httpAdapterInterface';
import { GetMentorByIdService } from 'src/modules/mentors/services/getMentorById.service';
import { UpdateCalendlyInfoDto } from '../dto/calendly-info-dto';
import { UpdateCalendlyInfoService } from './update-calendly-info.service';
import { CustomNotFoundException } from 'src/shared/exceptions/notFound.exception';

@Injectable()
export class OAuthCallbackService {
  constructor(
    private readonly updateCalendlyInfo: UpdateCalendlyInfoService,
    private readonly getMentorByIdService: GetMentorByIdService,
    @Inject('IHttpAdapter') private readonly httpAdapter: IHttpAdapter,
  ) {}

  async execute(code: string, mentorId: string) {
    if (!mentorId) {
      throw new InternalServerErrorException(
        'Mentor ID is required to proceed with OAuth.',
      );
    }

    try {
      const tokenResponse = await this.httpAdapter.callbackPost(
        '/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.CALENDLY_REDIRECT_URI,
          client_id: process.env.CALENDLY_CLIENT_ID,
          client_secret: process.env.CALENDLY_CLIENT_SECRET,
        }),
      );

      const accessToken = tokenResponse.access_token;
      const refreshToken = tokenResponse.refresh_token;
      const expiresIn = tokenResponse.expires_in;
      const expirationTime = new Date(Date.now() + expiresIn * 1000);

      const mentorResult = await this.getMentorByIdService.execute(mentorId);

      if (mentorResult.status !== 200 || !mentorResult.data) {
        throw new CustomNotFoundException('Mentor not found');
      }

      const mentor = mentorResult.data;

      const calendlyInfoDto: UpdateCalendlyInfoDto = {
        calendlyAccessToken: accessToken,
        calendlyRefreshToken: refreshToken,
        accessTokenExpiration: expirationTime,
      };

      await this.updateCalendlyInfo.execute(
        mentor.id,
        calendlyInfoDto,
        mentor.email,
        false,
      );

      return { message: 'OAuth successful' };
    } catch (error) {
      console.error(
        'Error during OAuth process:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'OAuth process failed. Please try again.',
      );
    }
  }
}
