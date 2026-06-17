import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SyncUserProfileSharedFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(600, { message: 'Maximum text length exceeded' })
  @ApiProperty({
    required: false,
    description: 'Texto de bio compartilhado entre os perfis',
  })
  aboutMe?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Imagem de perfil compartilhada entre os perfis',
  })
  profile?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Chave da imagem de perfil compartilhada',
  })
  profileKey?: string;

  @IsOptional()
  @IsBoolean()
  syncAboutMe?: boolean;

  @IsOptional()
  @IsBoolean()
  syncProfile?: boolean;
}
