import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../../shared/utils/handle-error.util';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserRepository extends PrismaClient {
  async createNewUser(data: Partial<UserEntity>): Promise<UserEntity> {
    return this.users.create({ data: data as any }).catch(handleError);
  }

  async createUserProfile(data: Partial<UserEntity>): Promise<UserEntity> {
    return this.users.create({ data: data as any }).catch(handleError);
  }

  async findAllUsers(): Promise<UserEntity[]> {
    return this.users.findMany().catch(handleError);
  }

  async findUserByEmail(email: string): Promise<UserEntity> {
    return this.users
      .findUnique({
        where: { email },
      })
      .catch(handleError);
  }

  async findFullUserById(id: string): Promise<UserEntity> {
    return this.users
      .findUnique({
        where: { id },
      })
      .catch(handleError);
  }

  async findUserById(id: string): Promise<any> {
    return this.users
      .findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          email: true,
          gender: true,
          aboutMe: true,
          copiedAboutMeFromMentor: true,
          specialties: true,
          registerComplete: true,
          profile: true,
          profileKey: true,
          copiedProfileFromMentor: true,
          deleted: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(handleError);
  }

  async desativateUserById(id: string): Promise<UserEntity> {
    return this.users
      .update({
        where: {
          id,
        },
        data: {
          deleted: true,
          updatedAt: new Date(),
          deactivatedDays: 0,
          deactivatedAt: null,
        },
      })
      .catch(handleError);
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<void> {
    await this.users
      .update({ where: { id }, data: data as any })
      .catch(handleError);
  }

  async updateUserUrl(id: string, urlImage: string): Promise<void> {
    await this.users
      .update({ where: { id }, data: { profile: urlImage } })
      .catch(handleError);
  }

  async deleteUserById(id: string): Promise<void> {
    await this.users.delete({ where: { id } }).catch(handleError);
  }
}
