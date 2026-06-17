import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggedEntity } from '../auth/decorator/loggedEntity.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { CreateMentorshipFeedbackDto } from './dto/create-mentorship-feedback.dto';
import { CreateMentorshipFeedbackService } from './services/create-mentorship-feedback.service';
import { GetMenteeFeedbackSessionService } from './services/get-mentee-feedback-session.service';
import { ListMenteeFeedbackService } from './services/list-mentee-feedback.service';

@Controller('mentorship-feedback')
export class MentorshipFeedbackController {
  constructor(
    private readonly listMenteeFeedbackService: ListMenteeFeedbackService,
    private readonly getMenteeFeedbackSessionService: GetMenteeFeedbackSessionService,
    private readonly createMentorshipFeedbackService: CreateMentorshipFeedbackService,
  ) {}

  @UseGuards(AuthGuard())
  @Get('me')
  async getMenteeFeedback(@LoggedEntity() user: UserEntity) {
    return this.listMenteeFeedbackService.execute(user);
  }

  @UseGuards(AuthGuard())
  @Get('me/:historyId')
  async getMenteeFeedbackSession(
    @Param('historyId') historyId: string,
    @LoggedEntity() user: UserEntity,
  ) {
    return this.getMenteeFeedbackSessionService.execute(historyId, user);
  }

  @UseGuards(AuthGuard())
  @Post()
  async createFeedback(
    @LoggedEntity() user: UserEntity,
    @Body() data: CreateMentorshipFeedbackDto,
  ) {
    return this.createMentorshipFeedbackService.execute(user, data);
  }
}
