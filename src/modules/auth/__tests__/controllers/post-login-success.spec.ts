import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../auth.controller';
import { InfoLoginDto } from '../../dtos/info-login.dto';
import { LoginTypeEnum } from '../../enums/login-type.enum';
import { InfoEntity } from '../../entity/info.entity';

describe('Auth Controller Tests', () => {
  let controller: AuthController;
  let authService: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      execute: vi.fn(),
    };

    controller = new AuthController(authService as any);
  });

  it('Should be able to login', async () => {
    const loginData: InfoLoginDto = {
      email: 'example@example.com',
      password: 'password',
      type: LoginTypeEnum.MENTOR,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockInfo: InfoEntity = {
      id: '1',
      email: loginData.email,
      password: 'password',
      emailConfirmed: true,
      deleted: false,
      fullName: 'Test Mentor',
      dateOfBirth: '1990-01-01',
      specialties: ['Node.js'],
      accessAttempt: 0,
    };

    const response = {
      status: 200,
      data: {
        token: 'token',
        info: mockInfo,
      },
    };

    authService.execute.mockResolvedValue(response);
    await controller.login(loginData, res as any);

    expect(authService.execute).toHaveBeenCalledWith(loginData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(response.data);
  });
});
