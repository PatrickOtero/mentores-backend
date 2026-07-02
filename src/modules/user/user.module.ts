import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { MailModule } from '../mails/mail.module';
import { PassportModule } from '@nestjs/passport';
import { UserRepository } from './user.repository';
import { GenerateCodeUtil } from '../../shared/utils/generate-code.util';
import { FileUploadService } from '../upload/upload.service';
import { ActivateUserService } from './services/activateUser.service';
import { ChangeUserPasswordService } from './services/changeUserPassword.service';
import { CreateUserService } from './services/createUser.service';
import { DesactivateLoggedUserService } from './services/deactivateLoggedUser.service';
import { DiscardUserProfileDraftService } from './services/discardUserProfileDraft.service';
import { GetUserByIdService } from './services/findUserById.service';
import { GetAllUsersService } from './services/getAllUsers.service';
import { RedefineUserPasswordService } from './services/redefineUserPassword.service';
import { SendRestorationEmailService } from './services/sendRestorationEmail.service';
import { UpdateUserService } from './services/updateUser.service';
import { UploadProfileImageService } from './services/uploadProfileImage.service';
import { NorthFlankTestMethod } from './services/northFlankTest.service';
import { CreateUserProfileService } from './services/createUserProfile.service';
import { MentorRepository } from '../mentors/repository/mentor.repository';
import { SyncUserProfileSharedFieldsService } from './services/syncUserProfileSharedFields.service';

@Module({
  imports: [MailModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [UserController],
  providers: [
    ActivateUserService,
    ChangeUserPasswordService,
    CreateUserService,
    DesactivateLoggedUserService,
    DiscardUserProfileDraftService,
    GetUserByIdService,
    GetAllUsersService,
    RedefineUserPasswordService,
    SendRestorationEmailService,
    UpdateUserService,
    UploadProfileImageService,
    CreateUserProfileService,
    SyncUserProfileSharedFieldsService,
    UserRepository,
    MentorRepository,
    GenerateCodeUtil,
    FileUploadService,
    NorthFlankTestMethod,
  ],
  exports: [UserRepository, DesactivateLoggedUserService],
})
export class UserModule {}
