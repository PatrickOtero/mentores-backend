import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SwaggerConfirmEmail } from '../../shared/Swagger/decorators/confirm-email.swagger.decorator';
import { SwaggerCreateMentor } from '../../shared/Swagger/decorators/mentor/create-mentor.swagger.decorator';
import { SwaggerGetMentor } from '../../shared/Swagger/decorators/mentor/get-mentor.swagger.decorator';
import { ActivateMentorDto } from './dtos/activate-mentor.dto';
import { CreateMentorDto } from './dtos/create-mentor.dto';
import { SearchMentorDto } from './dtos/search-mentor.dto';
import { UpdateMentorDto } from './dtos/update-mentor.dto';
import { SearchByEmailDto } from './dtos/search-by-email.dto';
import { MentorPassConfirmationDto } from './dtos/mentor-pass-confirmation.dto';
import { SwaggerRestoreAccountEmail } from '../../shared/Swagger/decorators/mentor/classes/restoreAccountEmail.swagger';
import { LoggedEntity } from '../auth/decorator/loggedEntity.decorator';
import { MentorEntity } from './entities/mentor.entity';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerUpdateMentorById } from '../../shared/Swagger/decorators/mentor/update-mentor-by-id.swagger';
import { GetByIdDto } from './dtos/get-by-id.dto copy';
import { SwaggerRestoreAccount } from '../../shared/Swagger/decorators/restore-account.swagger.decorator';
import { MentorChangePassDto } from './dtos/mentor-change-pass.dto';
import { ActivateMentorService } from './services/activateMentor.service';
import { ChangeMentorPasswordService } from './services/changeMentorPassword.service';
import { CreateMentorService } from './services/createMentor.service';
import { DeactivateLoggedMentorService } from './services/deactivateLoggedMentor.service';
import { GetMentorByIdService } from './services/getMentorById.service';
import { GetMentorByNameAndRoleService } from './services/getMentorByNameAndRole.service';
import { ListAllMentorsService } from './services/listAllMentors.service';
import { RedefineMentorPasswordService } from './services/redefineMentorPassword.service';
import { SendRestorationEmailService } from './services/sendRestorationEmail.service';
import { UpdateMentorService } from './services/updateMentor.service';
import { UploadProfileImageService } from './services/uploadProfileImage.service';
import { FinishMentorRegisterService } from './services/finishMentorRegisterService.service';
import { SwaggerCompleteRegister } from '../../shared/Swagger/decorators/complete-register.swagger';
import { SwaggerChangePassword } from '../../shared/Swagger/decorators/change-password.swagger';
import { SwaggerUploadProfileImage } from '../../shared/Swagger/decorators/uploadProfileImage.swagger';
import { ListAllRegisteredMentorsService } from './services/listAllRegisteredMentors.service';
import { ResendConfirmationEmailService } from './services/resendConfirmationEmail.service';

@ApiTags('mentor')
@Controller('mentor')
export class MentorController {
  constructor(
    private activateMentorService: ActivateMentorService,
    private changeMentorPasswordService: ChangeMentorPasswordService,
    private createMentorService: CreateMentorService,
    private deactivateLoggedMentorService: DeactivateLoggedMentorService,
    private getMentorByIdService: GetMentorByIdService,
    private getMentorByNameAndRoleService: GetMentorByNameAndRoleService,
    private listAllMentorsService: ListAllMentorsService,
    private redefineMentorPasswordService: RedefineMentorPasswordService,
    private sendRestorationEmailService: SendRestorationEmailService,
    private updateMentorService: UpdateMentorService,
    private uploadProfileImageService: UploadProfileImageService,
    private finishMentorRegisterService: FinishMentorRegisterService,
    private getRegisteredMentorsService: ListAllRegisteredMentorsService,
<<<<<<< HEAD
=======
    private resendConfirmationEmailService: ResendConfirmationEmailService,
>>>>>>> 092092cf4f70d6a9ee0b7a315dca72df6c80b3ee
  ) {}

  @Post()
  @SwaggerCreateMentor()
  async createMentor(
    @Body() createMentorDto: CreateMentorDto,
    @Res() res: Response,
  ) {
    const { message, statusCode } = await this.createMentorService.execute(
      createMentorDto,
    );

    return res.json({ message: message }).status(statusCode);
  }

  @ApiExcludeEndpoint()
  @Get()
  async getAllMentors(@Res() res: Response) {
    const mentorsList = await this.listAllMentorsService.execute();

    return res.json(mentorsList).status(200);
  }

  @Get('registered')
  async getRegisteredMentors() {
    return await this.getRegisteredMentorsService.execute();
  }

  @Get('search')
  @SwaggerGetMentor()
  async findByNameAndRole(
    @Res() res: Response,
    @Query() { fullName, specialty }: SearchMentorDto,
  ) {
    const data = await this.getMentorByNameAndRoleService.execute(
      fullName,
      specialty,
    );

    return res.status(HttpStatus.OK).json(data);
  }

  @Get([':id'])
  @SwaggerGetMentor()
  async getMentorById(@Param() { id }: GetByIdDto, @Res() res: Response) {
    const { status, data } = await this.getMentorByIdService.execute(id);

    return res.status(status).send(data);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @SwaggerUpdateMentorById()
  @Put()
  async updateMentor(
    @LoggedEntity() mentor: MentorEntity,
    @Body() data: UpdateMentorDto,
  ) {
    return await this.updateMentorService.execute(mentor.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @SwaggerChangePassword()
  @Put('change_password')
  async changeMentorPassword(
    @LoggedEntity() mentor: MentorEntity,
    @Body() data: MentorChangePassDto,
    @Res() res: Response,
  ) {
    const { message, status } = await this.changeMentorPasswordService.execute(
      mentor,
      data,
    );

    return res.status(status).json({ message: message });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  @SwaggerUploadProfileImage()
  @Post('uploadProfileImage')
  async uploadProfileImage(
    @LoggedEntity() mentor: MentorEntity,
    @UploadedFile('file') file,
  ) {
    return await this.uploadProfileImageService.execute(
      mentor.id,
      mentor,
      file,
    );
  }

  @Patch('active')
  @SwaggerConfirmEmail()
  async activeMentor(
    @Query() queryData: ActivateMentorDto,
    @Res() res: Response,
  ) {
    const { data, status } = await this.activateMentorService.execute(
      queryData,
    );
    return res.status(status).send(data);
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard())
  @Patch()
  async deactivateLoggedEntity(@LoggedEntity() mentor: MentorEntity) {
    return this.deactivateLoggedMentorService.execute(mentor);
  }

  @SwaggerRestoreAccountEmail()
  @Post('restoreAccount/:email')
  async restoreAccount(@Param() { email }: SearchByEmailDto) {
    return this.sendRestorationEmailService.execute(email);
  }

  @Patch('restoreAccount/redefinePass')
  @SwaggerRestoreAccount()
  async redefineMentorPassword(
    @Query() queryData: ActivateMentorDto,
    @Body() passData: MentorPassConfirmationDto,
  ) {
    return this.redefineMentorPasswordService.execute(queryData, passData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @SwaggerCompleteRegister()
  @Post('completeRegister')
  async finishMentorRegister(@LoggedEntity() mentor: MentorEntity) {
    try {
      return this.finishMentorRegisterService.execute(mentor.id);
    } catch (error) {
      console.log(error.message);
    }
  }

  @Post('resend-confirmation-email')
  async resendConfirmationEmail(@Body() data: SearchByEmailDto) {
    return this.resendConfirmationEmailService.execute(data.email);
  }
}
