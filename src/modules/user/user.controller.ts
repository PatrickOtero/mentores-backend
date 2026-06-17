import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Res,
  UseGuards,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SwaggerConfirmEmail } from '../../shared/Swagger/decorators/confirm-email.swagger.decorator';
import { ActivateUserDto } from './dto/activate-user.dto';
import { Response } from 'express';
import { GetByIdDto } from '../testimony/dto/get-by-id.dto copy';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerRestoreAccountEmail } from '../../shared/Swagger/decorators/mentor/classes/restoreAccountEmail.swagger';
import { SearchByEmailDto } from '../mentors/dtos/search-by-email.dto';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggedEntity } from '../auth/decorator/loggedEntity.decorator';
import { UserPassConfirmationDto } from './dto/user-pass-confirmation.dto';
import { SwaggerUpdateUserById } from '../../shared/Swagger/decorators/user/update-user-by-id.swagger';
import { SwaggerGetUser } from '../../shared/Swagger/decorators/user/get-user.swagger.decorator';
import { SwaggerRestoreAccount } from '../../shared/Swagger/decorators/restore-account.swagger.decorator';
import { ActivateUserService } from './services/activateUser.service';
import { CreateUserService } from './services/createUser.service';
import { DesactivateLoggedUserService } from './services/deactivateLoggedUser.service';
import { GetUserByIdService } from './services/findUserById.service';
import { GetAllUsersService } from './services/getAllUsers.service';
import { RedefineUserPasswordService } from './services/redefineUserPassword.service';
import { UpdateUserService } from './services/updateUser.service';
import { UploadProfileImageService } from './services/uploadProfileImage.service';
import { SendRestorationEmailService } from './services/sendRestorationEmail.service';
import { SwaggerUploadProfileImage } from '../../shared/Swagger/decorators/uploadProfileImage.swagger';
import { SwaggerCreateUser } from '../../shared/Swagger/decorators/user/create-user.swagger.decorator';
import { NorthFlankTestMethod } from './services/northFlankTest.service';
import { CreateUserProfileService } from './services/createUserProfile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { ChangeUserPasswordService } from './services/changeUserPassword.service';
import { DiscardUserProfileDraftService } from './services/discardUserProfileDraft.service';
import { SyncUserProfileSharedFieldsDto } from './dto/sync-user-profile-shared-fields.dto';
import { SyncUserProfileSharedFieldsService } from './services/syncUserProfileSharedFields.service';
import { UserChangePassDto } from './dto/user-change-pass.dto';
import { SwaggerChangePassword } from '../../shared/Swagger/decorators/change-password.swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private activateUserService: ActivateUserService,
    private createUserService: CreateUserService,
    private deactivateLoggedUserService: DesactivateLoggedUserService,
    private getUserByIdService: GetUserByIdService,
    private getAllUsersService: GetAllUsersService,
    private redefineUserPasswordService: RedefineUserPasswordService,
    private sendRestorationEmailService: SendRestorationEmailService,
    private updateUserService: UpdateUserService,
    private uploadProfileImageService: UploadProfileImageService,
    private northFlankTestMethod: NorthFlankTestMethod,
    private createUserProfileService: CreateUserProfileService,
    private changeUserPasswordService: ChangeUserPasswordService,
    private discardUserProfileDraftService: DiscardUserProfileDraftService,
    private syncUserProfileSharedFieldsService: SyncUserProfileSharedFieldsService,
  ) {}

  @Post()
  @SwaggerCreateUser()
  create(@Body() createUserDto: CreateUserDto) {
    return this.createUserService.execute(createUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Post('profile')
  async createUserProfile(
    @LoggedEntity() user: UserEntity,
    @Body() data: CreateUserProfileDto,
    @Res() res: Response,
  ) {
    const { status, data: userProfile } =
      await this.createUserProfileService.execute(user, data);

    return res.status(status).send(userProfile);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Delete('profile/draft')
  async discardUserProfileDraft(
    @LoggedEntity() user: UserEntity,
    @Res() res: Response,
  ) {
    const { status, data } = await this.discardUserProfileDraftService.execute(
      user.email,
    );

    return res.status(status).send(data);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Patch('profile/shared-fields')
  async syncUserProfileSharedFields(
    @LoggedEntity() user: UserEntity,
    @Body() data: SyncUserProfileSharedFieldsDto,
    @Res() res: Response,
  ) {
    const { status, data: response } =
      await this.syncUserProfileSharedFieldsService.execute(user.email, data);

    return res.status(status).send(response);
  }

  @Patch('active')
  @SwaggerConfirmEmail()
  async activeUser(@Query() queryData: ActivateUserDto, @Res() res: Response) {
    const { data, status } = await this.activateUserService.execute(queryData);
    return res.status(status).send(data);
  }

  @ApiExcludeEndpoint()
  @Get()
  async getAllUsers() {
    return this.getAllUsersService.execute();
  }

  @Get([':id'])
  @SwaggerGetUser()
  async getUserById(@Param() { id }: GetByIdDto, @Res() res: Response) {
    const { status, data } = await this.getUserByIdService.execute(id);

    return res.status(status).send(data);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @SwaggerChangePassword()
  @Put('change_password')
  async changeUserPassword(
    @LoggedEntity() user: UserEntity,
    @Body() data: UserChangePassDto,
    @Res() res: Response,
  ) {
    const { message, status } = await this.changeUserPasswordService.execute(
      user,
      data,
    );

    return res.status(status).json({ message });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @SwaggerUpdateUserById()
  @Put(':id')
  async updateUser(
    @LoggedEntity() user: UserEntity,
    @Body() data: UpdateUserDto,
  ) {
    return await this.updateUserService.execute(user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  @SwaggerUploadProfileImage()
  @Post('uploadProfileImage')
  async uploadProfileImage(
    @LoggedEntity() user: UserEntity,
    @UploadedFile('file') file,
  ) {
    return await this.uploadProfileImageService.execute(user.id, user, file);
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard())
  @Patch('delete-user')
  async deleteUser(@LoggedEntity() user: UserEntity) {
    return this.deactivateLoggedUserService.execute(user.email);
  }

  @ApiExcludeEndpoint()
  @Patch(':id')
  async desactivateLoggedEntity(@Param() { id }: GetByIdDto) {
    const user = await this.getUserByIdService.execute(id);
    return this.deactivateLoggedUserService.execute(user.data.email);
  }

  @SwaggerRestoreAccountEmail()
  @Post('restoreAccount/:email')
  async restoreAccount(@Param() { email }: SearchByEmailDto) {
    return this.sendRestorationEmailService.execute(email);
  }

  @Patch('restoreAccount/redefinePass')
  @SwaggerRestoreAccount()
  async redefineUserPassword(
    @Query() queryData: ActivateUserDto,
    @Body() passData: UserPassConfirmationDto,
  ) {
    return this.redefineUserPasswordService.execute(queryData, passData);
  }

  @Get('northflank/test')
  async northFlankTest() {
    return this.northFlankTestMethod.execute();
  }
}
