import { Injectable } from '@nestjs/common';

@Injectable()
export class InitiateOAuthService {
  async initiateOAuth(mentorId: string) {
    const params = new URLSearchParams({
<<<<<<< HEAD
      client_id: process.env.CALENDLY_CLIENT_ID,
      redirect_uri: process.env.CALENDLY_REDIRECT_URI,
=======
      client_id: process.env.SOUJUNIOR_DEV_CLIENT_ID,
      redirect_uri: process.env.SOUJUNIOR_DEV_REDIRECT_URI,
>>>>>>> 28480ca19788fb0218e7e5c6c6ff6e44aea448f7
      response_type: 'code',
      scope: 'user:read:email scheduling:read',
      state: mentorId,
    });

    const url = `https://calendly.com/oauth/authorize?${params.toString()}`;

    console.log(`Redirecting to Calendly OAuth URL: ${url}`);

    return { message: 'OAuth initiated', url };
  }
}
