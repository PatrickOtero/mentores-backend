import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CalendlyRepository } from '../repository/calendly.repository';
import { IHttpAdapter } from '../../../lib/adapter/httpAdapterInterface';

@Injectable()
export class OAuthCallbackService {
  constructor(
    private readonly calendlyRepository: CalendlyRepository,
    @Inject('IHttpAdapter') private readonly http: IHttpAdapter,
  ) {}

  async execute(code: string, mentorId: string) {
    if (!mentorId) {
      throw new InternalServerErrorException(
        'Mentor ID is required to proceed with OAuth.',
      );
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SOUJUNIOR_REDIRECT_URI,
        client_id: process.env.SOUJUNIOR_CLIENT_ID,
        client_secret: process.env.SOUJUNIOR_CLIENT_SECRET,
      }).toString();

      const tokenResponse = await this.http.post(
        'https://auth.calendly.com/oauth/token',
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse;
      const expirationTime = new Date(Date.now() + Number(expires_in) * 1000);

      await this.calendlyRepository.updateCalendlyInfo(mentorId, {
        calendlyAccessToken: access_token,
        calendlyRefreshToken: refresh_token,
        accessTokenExpiration: expirationTime,
      });

      return { message: 'OAuth successful' };
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      console.error('[Calendly OAuth] token error', { status, data });

      throw new InternalServerErrorException(
        `OAuth process failed: ${status ?? 'unknown'} ${
          typeof data === 'string' ? data : JSON.stringify(data)
        }`,
      );
    }
  }
}
