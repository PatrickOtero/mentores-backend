import {
  Body,
  Controller,
  Get,
  HttpException,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SwaggerLogged } from '../../shared/Swagger/decorators/auth/logged.swagger.decorator';

import { SwaggerLogin } from '../../shared/Swagger/decorators/auth/login.swagger.decorator';
import { MentorEntity } from '../mentors/entities/mentor.entity';
import { AuthService } from './services/auth.service';
import { LoggedEntity } from './decorator/loggedEntity.decorator';
import { InfoLoginDto } from './dtos/info-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { SwitchProfileDto } from './dtos/switch-profile.dto';
import { InfoEntity } from './entity/info.entity';
import { DeleteAccountDto } from './dtos/delete-account.dto';
import { DeleteAccountService } from './services/delete-account.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private deleteAccountService: DeleteAccountService,
  ) {}

  @Post('/login')
  @SwaggerLogin()
  async login(@Body() loginData: InfoLoginDto, @Res() res: Response) {
    try {
      const { status, data } = await this.authService.execute(loginData);

      return res.status(status).send(data);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).send(error.getResponse());
      } else {
        return res.status(500).send({ message: 'Internal Server Error' });
      }
    }
  }

  @Post('/switch-profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  async switchProfile(
    @LoggedEntity() entity: InfoEntity,
    @Body() profileData: SwitchProfileDto,
    @Res() res: Response,
  ) {
    try {
      const { status, data } = await this.authService.switchProfile(
        entity.email,
        profileData.type,
      );

      return res.status(status).send(data);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).send(error.getResponse());
      }

      return res.status(500).send({ message: 'Internal Server Error' });
    }
  }

  @Get('/user-logged')
  @SwaggerLogged()
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  async userLogged(@LoggedEntity() mentor: MentorEntity) {
    return mentor;
  }

  @Get('/profiles')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  async getProfiles(@LoggedEntity() entity: InfoEntity, @Res() res: Response) {
    const { status, data } = await this.authService.getProfiles(entity.email);

    return res.status(status).send(data);
  }

  @Patch('/delete-account')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  async deleteAccount(
    @LoggedEntity() entity: InfoEntity,
    @Body() deleteAccountData: DeleteAccountDto,
    @Res() res: Response,
  ) {
    const { status, data } = await this.deleteAccountService.execute(
      entity.email,
      deleteAccountData.target,
    );

    return res.status(status).send(data);
  }
}
