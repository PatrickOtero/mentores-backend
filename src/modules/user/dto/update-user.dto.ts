import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Match } from '../../../modules/mentors/decorators/match.decorator';
import { Gender } from '../../../modules/mentors/enums/gender.enum';
import { Specialties } from '../../../modules/mentors/enums/specialties.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "the 'fullName' field must not be empty" })
  @MaxLength(100, { message: 'Maximum of 100 characters exceeded' })
  @ApiProperty({
    required: true,
    example: 'Fulano de tal',
  })
  fullName?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'The dateOfBirth field must not be empty' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MaxDate(new Date(), {
    message: 'The date must be before the current date',
  })
  @ApiProperty({
    required: true,
    example: '2023-04-06',
  })
  dateOfBirth?: Date | string;

  @IsOptional()
  @IsString({ message: 'Only strings are allowed in this field' })
  @IsEmail(undefined, {
    message: 'Invalid e-mail format',
  })
  @MaxLength(100, { message: 'Maximum of 100 characters exceeded' })
  @IsNotEmpty({ message: "the 'email' field must not be empty" })
  @Transform(({ value }) => value.toLowerCase())
  @ApiProperty({
    required: true,
    example: 'fulano.de.tal@dominio.com',
  })
  email?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Specialties, { each: true })
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ApiProperty({
    required: false,
    type: 'String array',
    example: 'Front-End, Back-End, QA, Dev Ops',
  })
  specialties?: string[];

  @IsOptional()
  @IsEnum(Gender)
  @IsString()
  @ApiProperty({
    required: false,
    example: 'Não binário',
  })
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(600, { message: 'Maximum text length exceeded' })
  aboutMe?: string;

  @IsOptional()
  @IsBoolean()
  copiedAboutMeFromMentor?: boolean;

  @IsNotEmpty({ message: "the 'password' field must not be empty" })
  @IsString({ message: 'Only strings are allowed in this field' })
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+{};:,<.>])[a-zA-Z\d!@#$%^&*()\-_=+{};:,<.>.]{8,}$/,
    {
      message:
        'Password must have a minimum of 8 characters, a capital letter, a number and a symbol',
    },
  )
  @ApiProperty({
    description: 'Senha de Login',
    example: 'Abcd@123',
  })
  @IsOptional()
  password?: string;

  @IsNotEmpty({ message: "the 'passwordConfirmation' field must not be empty" })
  @IsString()
  @ApiProperty({
    description: 'Confirmação de senha',
    example: 'Abcd@123',
  })
  @Match('password', {
    message: 'The password does not match with the password confirmation',
  })
  @IsOptional()
  passwordConfirmation?: string;

  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  registerComplete?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Imagem do perfil',
  })
  profile?: string;

  @IsOptional()
  @IsBoolean()
  copiedProfileFromMentor?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Chave para remoção da imagem do perfil',
  })
  profileKey?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: "Days of user's account deactivation.",
  })
  deactivatedDays?: number;

  @IsOptional()
  deactivatedAt?: Date | null;

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

  @IsOptional()
  @IsBoolean()
  emailConfirmed?: boolean;

  @IsOptional()
  @IsString()
  defaultProfile?: string;

  @IsOptional()
  file?: any;
}
