import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { OAuthCallbackService } from './services/calendly-callback.service';
import { InitiateOAuthService } from './services/calendlyOAuth.service';
import { FetchSchedulesService } from './services/fetch-schedules.service';
import { Response } from 'express';
import { SearchByEmailDto } from './dto/search-by-email.dto';
import { CreateCalendlyInfoDto, UpdateCalendlyInfoDto } from './dto/calendly-info-dto';
import { CreateCalendlyInfoService } from './services/create-calendly-info.service';
import { UpdateCalendlyInfoService } from './services/update-calendly-info.service';
import { LoggedEntity } from '../auth/decorator/loggedEntity.decorator';
import { MentorEntity } from '../mentors/entities/mentor.entity';
import { GetCalendlyMentorInfoService } from './services/get-calendly-mentor-info.service';
import { AuthGuard } from '@nestjs/passport';
import { GetAllCalendlyMentorInfosService } from './services/get-all-calendly-mentor-infos.service';
import { CalendlySchedulingService } from './services/calendly-scheduling.service';
import {
  CancelCalendlyScheduleDto,
  CreateCalendlyInviteeDto,
  GetCalendlyAvailableTimesDto,
} from './dto/calendly-scheduling.dto';


@Controller('calendly')
export class CalendlyController {

    constructor(
        private readonly oauthCallbackService: OAuthCallbackService,
        private readonly initiateOAuthService: InitiateOAuthService,
        private readonly fetchSchedulesService: FetchSchedulesService,
        private createCalendlyInfoService: CreateCalendlyInfoService,
        private updateCalendlyInfoService: UpdateCalendlyInfoService,
        private getCalendlyMentorInfoService: GetCalendlyMentorInfoService,
        private getAllCalendlyMentorInfosService: GetAllCalendlyMentorInfosService,
        private calendlySchedulingService: CalendlySchedulingService
      ) {}
      
    @Get("")
    async getAllCalendlyMentorInfos () {
      return await this.getAllCalendlyMentorInfosService.execute();
    }

    @Get("mentorInfo")
    @UseGuards(AuthGuard())
    async getCalendlyMentorInfo (@LoggedEntity() mentor: MentorEntity) {
      return await this.getCalendlyMentorInfoService.execute(mentor.id);
    }
      
    @Get('connect')
    async connect(@Query('mentorId') mentorId: string, @Res() res: Response) {
      const { url } = await this.initiateOAuthService.initiateOAuth(mentorId);
      return res.redirect(url);
    }
  
    @Get('callback')
    async oauthCallback(
      @Query('code') code: string,
      @Query('state') mentorId: string,
      @Res() res: Response,
    ) {
      try {
        await this.oauthCallbackService.execute(code, mentorId);

        const redirectUrl = `${process.env.FRONTEND_URL}/me?tab=schedule&calendly=success`;

        return res.redirect(redirectUrl);

      } catch (error) {
        const redirectUrl = `${process.env.FRONTEND_URL}/me?tab=schedule&calendly=error`;

        return res.redirect(redirectUrl);
      }
    }

    @Get('schedules')
    @UseGuards(AuthGuard())
    async fetchMentorSchedules(@LoggedEntity() mentor: MentorEntity) {
      return this.fetchSchedulesService.getMentorSchedules(mentor.id);
    }

    @Get('mentor/:mentorId/available-times')
    async getMentorAvailableTimes(
      @Param('mentorId') mentorId: string,
      @Query() query: GetCalendlyAvailableTimesDto,
    ) {
      return this.calendlySchedulingService.getAvailableTimes(mentorId, query);
    }

    @Post('mentor/:mentorId/invitees')
    @UseGuards(AuthGuard())
    async createMentorInvitee(
      @Param('mentorId') mentorId: string,
      @Body() data: CreateCalendlyInviteeDto,
      @LoggedEntity() invitee: MentorEntity,
    ) {
      return this.calendlySchedulingService.createInvitee(
        mentorId,
        invitee,
        data,
      );
    }

    @Post('schedules/:eventUuid/cancellation')
    @UseGuards(AuthGuard())
    async cancelMentorSchedule(
      @Param('eventUuid') eventUuid: string,
      @Body() data: CancelCalendlyScheduleDto,
      @LoggedEntity() mentor: MentorEntity,
    ) {
      return this.calendlySchedulingService.cancelSchedule(
        mentor.id,
        eventUuid,
        data,
      );
    }

    @Post("")
    @UseGuards(AuthGuard())
    async createCalendlyInfo(
      @Body() data: CreateCalendlyInfoDto,
      @LoggedEntity() mentor: MentorEntity
    ) {
      return await this.createCalendlyInfoService.execute(data, mentor.id);
    }
  
    @Put(':id')
    @UseGuards(AuthGuard())
    async updateCalendlyInfo(
      @Body() data: UpdateCalendlyInfoDto,
      @LoggedEntity() mentor: MentorEntity
    ) {
      return await this.updateCalendlyInfoService.execute(mentor.id, data);
    }
}
