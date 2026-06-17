import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../auth.controller';
import { InfoLoginDto } from '../../dtos/info-login.dto';
import { LoginTypeEnum } from '../../enums/login-type.enum';

describe('Auth Controller Tests', () => {
  let controller: AuthController;
  let authService: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      execute: vi.fn(),
    };

    controller = new AuthController(authService as any);
  });

  it('should return a 500 error if an unknown error occurs', async () => {
    const loginData: InfoLoginDto = {
      email: 'test@example.com',
      password: 'password',
      type: LoginTypeEnum.MENTOR,
    };

    authService.execute.mockRejectedValue(new Error('Unexpected error'));

    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.login(loginData, res as any);

    expect(authService.execute).toHaveBeenCalledWith(loginData);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
