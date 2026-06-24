import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/service/prisma.service';
import {
  CreateCalendlyInfoDto,
  UpdateCalendlyInfoDto,
} from '../dto/calendly-info-dto';

@Injectable()
export class CalendlyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCalendlyMentorInfos() {
    return this.prisma.calendlyInfo.findMany({
      select: {
        id: true,
        mentorId: true,
        calendlyName: true,
        agendaName: true,
        calendlyAccessToken: true,
        calendlyRefreshToken: true,
      },
    });
  }

  async getConnectedCalendlySyncInfos() {
    return this.prisma.calendlyInfo.findMany({
      where: {
        calendlyAccessToken: {
          not: null,
        },
        mentorId: {
          not: '',
        },
      },
      select: {
        mentorId: true,
        calendlyUserUuid: true,
        calendlyAccessToken: true,
        calendlyRefreshToken: true,
        accessTokenExpiration: true,
        mentor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async createCalendlyInfo(data: CreateCalendlyInfoDto, mentorId: string) {
    Object.assign(data, {
      mentorId,
    });

    return this.prisma.calendlyInfo.create({
      data,
    });
  }

  async updateCalendlyInfo(
    mentorId: string,
    updateCalendlyInfoDto: UpdateCalendlyInfoDto,
  ) {
    if (updateCalendlyInfoDto.calendlyUserUuid) {
      const existingCalendly = await this.prisma.calendlyInfo.findFirst({
        where: {
          calendlyUserUuid: updateCalendlyInfoDto.calendlyUserUuid,
          mentorId: {
            not: mentorId,
          },
        },
      });

      if (existingCalendly) {
        throw new BadRequestException(
          'Não foi possível vincular esta agenda. Verifique se ela já está em uso  por outro perfil de mentor e tente novamente.',
        );
      }
    }

    return this.prisma.calendlyInfo.upsert({
      where: { mentorId },
      update: updateCalendlyInfoDto,
      create: {
        mentorId,
        ...updateCalendlyInfoDto,
      },
    });
  }

  async getCalendlyInfoByMentorId(mentorId: string) {
    return this.prisma.calendlyInfo.findUnique({
      where: { mentorId },
    });
  }
}
