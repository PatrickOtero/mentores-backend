import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
import { Match } from '../decorators/match.decorator';
import { Specialties } from '../enums/specialties.enum';

export class CreateMentorDto {
  @IsString()
  @IsNotEmpty({ message: "the 'fullName' field must not be empty" })
  @MaxLength(100, { message: 'Maximum of 100 characters exceeded' })
  @ApiProperty({
    required: true,
    example: 'Fulano de tal',
  })
  fullName: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MaxDate(new Date(), {
    message: 'The date must be before the current date',
  })
  @ApiProperty({
    required: true,
    example: '2023-04-06',
  })
  dateOfBirth: Date;

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
  email: string;

  @IsString({ message: 'Only strings are allowed in this field' })
  @IsEmail(undefined, {
    message: 'Invalid e-mail format',
  })
  @MaxLength(100, { message: 'Maximum of 100 characters exceeded' })
  @IsNotEmpty({ message: "the 'emailConfirm' field must not be empty" })
  @Transform(({ value }) => value.toLowerCase())
  @IsOptional()
  @ApiProperty({
    required: true,
    example: 'fulano.de.tal@dominio.com',
  })
  @Match('email', {
    message: 'The emails dont match',
  })
  emailConfirm?: string;

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
  password: string;

  @IsNotEmpty({ message: "the 'passwordConfirmation' field must not be empty" })
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Confirmação de senha',
    example: 'Abcd@123',
  })
  @Match('password', {
    message: 'The password does not match with the password confirmation',
  })
  passwordConfirmation?: string;

  @IsOptional()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Specialties, { each: true })
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ApiProperty({
    required: true,
    type: 'String array',
    example: 'Front-End, Back-End, QA, Dev Ops',
  })
  specialties?: string[];

  @IsNumber()
  @IsOptional()
  accessAttempt?: number

  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  registerComplete?: boolean;
}
