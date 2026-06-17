import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../../prisma/service/prisma.service';
import HttpAdapter from 'src/lib/adapter/httpAdapter';
import { CalendlyRepository } from '../calendly/repository/calendly.repository';
import { RefreshTokenService } from '../calendly/services/refresh-token.service';
import { MailModule } from '../mails/mail.module';
import { MentorRepository } from '../mentors/repository/mentor.repository';
import { UserRepository } from '../user/user.repository';
import { MentorshipFeedbackController } from './mentorship-feedback.controller';
import { MentorshipFeedbackRepository } from './repository/mentorship-feedback.repository';
import { CreateMentorshipFeedbackService } from './services/create-mentorship-feedback.service';
import { GetMenteeFeedbackSessionService } from './services/get-mentee-feedback-session.service';
import { ListMenteeFeedbackService } from './services/list-mentee-feedback.service';
import { SyncMentorshipHistoryService } from './services/sync-mentorship-history.service';

@Module({
  imports: [MailModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MentorshipFeedbackController],
  providers: [
    MentorshipFeedbackRepository,
    CreateMentorshipFeedbackService,
    GetMenteeFeedbackSessionService,
    ListMenteeFeedbackService,
    SyncMentorshipHistoryService,
    CalendlyRepository,
    RefreshTokenService,
    UserRepository,
    MentorRepository,
    PrismaService,
    JwtService,
    {
      provide: 'IHttpAdapter',
      useClass: HttpAdapter,
    },
  ],
})
export class MentorshipFeedbackModule {}
