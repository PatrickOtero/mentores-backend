import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
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

  it('should return an error if authService throws an HttpException', async () => {
    const loginData: InfoLoginDto = {
      email: 'test@example.com',
      password: 'wrongpassword',
      type: LoginTypeEnum.MENTOR,
    };

    const mockError = new HttpException('Invalid credentials', 401);

    authService.execute.mockRejectedValue(mockError);

    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.login(loginData, res as any);

    expect(authService.execute).toHaveBeenCalledWith(loginData);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(mockError.getResponse());
  });
});
