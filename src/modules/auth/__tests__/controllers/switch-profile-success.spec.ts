import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../auth.controller';
import { LoginTypeEnum } from '../../enums/login-type.enum';

describe('Auth Controller Tests', () => {
  let controller: AuthController;
  let authService: { switchProfile: ReturnType<typeof vi.fn> };
  let deleteAccountService: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      switchProfile: vi.fn(),
    };
    deleteAccountService = {
      execute: vi.fn(),
    };

    controller = new AuthController(
      authService as any,
      deleteAccountService as any,
    );
  });

  it('should switch the active profile', async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const response = {
      status: 200,
      data: {
        token: 'new-token',
        info: {
          id: '2',
          email: 'user@example.com',
        },
      },
    };

    authService.switchProfile.mockResolvedValue(response);

    await controller.switchProfile(
      { email: 'user@example.com' } as any,
      { type: LoginTypeEnum.USER },
      res as any,
    );

    expect(authService.switchProfile).toHaveBeenCalledWith(
      'user@example.com',
      LoginTypeEnum.USER,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(response.data);
  });
});
