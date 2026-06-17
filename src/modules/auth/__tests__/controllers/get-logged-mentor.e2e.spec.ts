import { beforeEach, describe, expect, it } from 'vitest';
import { AuthController } from '../../auth.controller';
import { MentorEntity } from 'src/modules/mentors/entities/mentor.entity';

describe('Auth Controller Tests', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController({} as any);
  });

  it('should return the logged mentor', async () => {
    const mockMentor = new MentorEntity();
    mockMentor.id = '1';
    mockMentor.fullName = 'Example User';
    mockMentor.dateOfBirth = new Date('1990-01-01');
    mockMentor.password = 'hashed-password';
    mockMentor.email = 'example@example.com';
    mockMentor.specialties = ['JavaScript', 'Node.js'];
    mockMentor.role = 'mentor';
    mockMentor.gender = 'male';
    mockMentor.aboutMe = 'Experienced mentor in full-stack development';
    mockMentor.createdAt = new Date();
    mockMentor.updatedAt = new Date();

    const result = await controller.userLogged(mockMentor as any);

    expect(result).toEqual(mockMentor);
  });
});
