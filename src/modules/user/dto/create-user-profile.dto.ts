import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '../../../modules/mentors/enums/gender.enum';
import { Specialties } from '../../../modules/mentors/enums/specialties.enum';

export class CreateUserProfileDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(600, { message: 'Maximum text length exceeded' })
  aboutMe?: string;

  @IsBoolean()
  @IsOptional()
  copiedAboutMeFromMentor?: boolean;

  @IsOptional()
  @IsEnum(Gender)
  @IsString()
  @ApiProperty({
    required: false,
    example: 'NÃ£o binÃ¡rio',
  })
  gender?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Imagem do perfil',
  })
  profile?: string;

  @IsBoolean()
  @IsOptional()
  copiedProfileFromMentor?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Chave para remoÃ§Ã£o da imagem do perfil',
  })
  profileKey?: string;

  @IsBoolean()
  @IsOptional()
  registerComplete?: boolean;
}
