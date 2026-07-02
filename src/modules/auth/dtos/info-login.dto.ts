import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class InfoLoginDto {
  @IsEmail(undefined, { message: 'Invalid e-mail format' })
  @IsNotEmpty({ message: "The 'email' field must not be empty" })
  @IsString({ message: 'Only strings are allowed in this field' })
  @ApiProperty({
    required: true,
    description: 'E-mail do usuário.',
    example: 'fulano.de.tal@dominio.com',
  })
  email: string;

  @IsString({ message: 'Only strings are allowed in this field' })
  @IsNotEmpty({ message: "The 'password' field must not be empty" })
  @ApiProperty({
    required: true,
    description: 'Senha de Login',
    example: 'Abcd@123',
  })
  password: string;

  @IsOptional()
  @IsIn(['mentor', 'user', 'mentee'], {
    message: 'This field only accepts: "mentor", "user" or "mentee"',
  })
  @IsString({ message: 'Only strings are allowed in this field' })
  @ApiProperty({
    required: false,
    description: 'Perfil desejado no login.',
    example: 'mentor',
  })
  type?: string;
}
