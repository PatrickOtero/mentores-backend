import { Injectable } from '@nestjs/common';

@Injectable()
export class InitiateOAuthService {
  async initiateOAuth(mentorId: string) {
    const params = new URLSearchParams({
      client_id: process.env.CALENDLY_CLIENT_ID,
      redirect_uri: process.env.CALENDLY_REDIRECT_URI,
      response_type: 'code',
      scope: 'users:read event_types:read scheduled_events:read scheduled_events:write',
      state: mentorId,
    });

    const url = `https://calendly.com/oauth/authorize?${params.toString()}`;

    console.log(`Redirecting to Calendly OAuth URL: ${url}`);

    return { message: 'OAuth initiated', url };
  }
}
