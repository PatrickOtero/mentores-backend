import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../../../shared/utils/handle-error.util';
import { MentorEntity } from '../entities/mentor.entity';

@Injectable()
export class MentorRepository extends PrismaClient {
  async findDeactivatedMentors(): Promise<MentorEntity[]> {
    return this.mentors
      .findMany({
        where: {
          deleted: true,
        },
      })
      .catch(handleError);
  }

  async createNewMentor(data: Partial<MentorEntity>): Promise<MentorEntity> {
    return this.mentors.create({ data: data as any }).catch(handleError);
  }

  async findAllMentors(): Promise<MentorEntity[]> {
    return this.mentors
      .findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          gender: true,
          aboutMe: true,
          profile: true,
          profileKey: true,
          specialties: true,
          role: true,
          dateOfBirth: true,
          emailConfirmed: true,
          registerComplete: true,
          accessAttempt: true,
          code: true,
          deleted: true,
          calendlyInfo: true,
          history: true,
          testimony: true,
          createdAt: true,
          updatedAt: true,
        },
        where: {
          deleted: false,
          isProfilePaused: false,
        },
      })
      .catch(handleError);
  }

  async findAllRegisteredMentors(): Promise<MentorEntity[]> {
    return this.mentors
      .findMany({
        where: {
          registerComplete: true,
          deleted: false,
          isProfilePaused: false,
        },
      })
      .catch(handleError);
  }

  async findMentorByEmail(email: string): Promise<MentorEntity> {
    return this.mentors
      .findUnique({
        where: { email },
      })
      .catch(handleError);
  }

  async findFullMentorById(id: string): Promise<MentorEntity> {
    return this.mentors
      .findUnique({
        where: { id },
      })
      .catch(handleError);
  }

  async findMentorById(id: string) {
    return this.mentors
      .findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          email: true,
          specialties: true,
          gender: true,
          profile: true,
          profileKey: true,
          aboutMe: true,
          registerComplete: true,
          isProfilePaused: true,
          deleted: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(handleError);
  }

  async findMentorByNameAndRole(
    fullName?: string,
    specialty?: string,
  ): Promise<MentorEntity[]> {
    const mentors = await this.mentors
      .findMany({
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          email: true,
          specialties: true,
          gender: true,
          profile: true,
          profileKey: true,
          aboutMe: true,
        },
        where: {
          deleted: false,
          isProfilePaused: false,
          OR: [
            { specialties: { has: specialty } },
            {
              fullName: fullName
                ? { contains: fullName, mode: 'insensitive' }
                : undefined,
            },
          ],
        },
      })
      .catch(handleError);

    return mentors;
  }

  async findMentorsBySingleQuery(query: string): Promise<MentorEntity[]> {
    return this.mentors.findMany({
      select: {
        id: true,
        fullName: true,
        dateOfBirth: true,
        email: true,
        specialties: true,
        gender: true,
        profile: true,
        profileKey: true,
        aboutMe: true,
      },
      where: {
        deleted: false,
        isProfilePaused: false,
        OR: [
          {
            fullName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            specialties: {
              has: query,
            },
          },
        ],
      },
    });
  }

  async deactivateMentorById(id: string): Promise<MentorEntity> {
    return this.mentors
      .update({
        where: {
          id,
        },
        data: {
          deleted: true,
          isProfilePaused: false,
          updatedAt: new Date(),
          deactivatedDays: 0,
          deactivatedAt: null,
        },
      })
      .catch(handleError);
  }

  async updateMentor(id: string, data: Partial<MentorEntity>): Promise<void> {
    await this.mentors
      .update({ where: { id }, data: data as any })
      .catch(handleError);
  }

  async updateMentorUrl(id: string, urlImage: string): Promise<void> {
    await this.mentors
      .update({ where: { id }, data: { profile: urlImage } })
      .catch(handleError);
  }

  async registerCompleteToggle(id: string): Promise<void> {
    await this.mentors
      .update({ where: { id }, data: { registerComplete: true } })
      .catch(handleError);
  }
}
