import { Module } from '@nestjs/common';
import { CalendlyController } from './calendly.controller';
import { OAuthCallbackService } from './services/calendly-callback.service';
import { InitiateOAuthService } from './services/calendlyOAuth.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { FetchSchedulesService } from './services/fetch-schedules.service';
import { MentorRepository } from '../mentors/repository/mentor.repository';
import { PrismaService } from '../../../prisma/service/prisma.service';
import { CalendlyRepository } from './repository/calendly.repository';
import { JwtService } from '@nestjs/jwt';
import { CreateCalendlyInfoService } from './services/create-calendly-info.service';
import { UpdateCalendlyInfoService } from './services/update-calendly-info.service';
import { GetCalendlyMentorInfoService } from './services/get-calendly-mentor-info.service';
import { PassportModule } from '@nestjs/passport';
import HttpAdapter from '../../lib/adapter/httpAdapter';
import { GetAllCalendlyMentorInfosService } from './services/get-all-calendly-mentor-infos.service';
import { CalendlySchedulingService } from './services/calendly-scheduling.service';
import { UserRepository } from '../user/user.repository';
import { MentorshipFeedbackRepository } from '../mentorship-feedback/repository/mentorship-feedback.repository';
import { SyncMentorshipHistoryService } from '../mentorship-feedback/services/sync-mentorship-history.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CalendlyController],
  providers: [
    OAuthCallbackService,
    InitiateOAuthService,
    RefreshTokenService,
    FetchSchedulesService,
    CreateCalendlyInfoService,
    UpdateCalendlyInfoService,
    GetCalendlyMentorInfoService,
    GetAllCalendlyMentorInfosService,
    CalendlySchedulingService,
    MentorshipFeedbackRepository,
    SyncMentorshipHistoryService,
    CalendlyRepository,
    MentorRepository,
    UserRepository,
    PrismaService,
    JwtService,
    {
      provide: 'IHttpAdapter',
      useClass: HttpAdapter,
    },
  ],

  exports: [CalendlyRepository, FetchSchedulesService],
})
export class CalendlyModule {}
