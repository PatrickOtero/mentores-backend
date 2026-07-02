import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../user.repository';
import { ChangeUserPasswordService } from '../../services/changeUserPassword.service';
import { UserEntity } from '../../entities/user.entity';

describe('ChangeUserPasswordService', () => {
  let service: ChangeUserPasswordService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      findFullUserById: vi.fn(),
      updateUser: vi.fn(),
    } as any;

    service = new ChangeUserPasswordService(userRepository);
  });

  it('should change the password when the old password is correct', async () => {
    const currentPasswordHash = await bcrypt.hash('OldPass@123', 10);
    const loggedUser: UserEntity = {
      id: '1',
      fullName: 'Test User',
      email: 'user@example.com',
      dateOfBirth: '1999-01-01',
      password: currentPasswordHash,
    };

    vi.mocked(userRepository.findFullUserById).mockResolvedValue(loggedUser);

    const result = await service.execute(loggedUser, {
      oldPassword: 'OldPass@123',
      password: 'NewPass@123',
      confirmPassword: 'NewPass@123',
    });

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      loggedUser.id,
      expect.objectContaining({ password: expect.any(String) }),
    );
    const updatedUserPayload = vi.mocked(userRepository.updateUser).mock
      .calls[0][1];
    expect(
      await bcrypt.compare('NewPass@123', updatedUserPayload.password),
    ).toBe(true);
    expect(result).toEqual({
      status: 200,
      message: 'Password changed successfully',
    });
  });

  it('should reject the password change when the old password is invalid', async () => {
    const currentPasswordHash = await bcrypt.hash('OldPass@123', 10);
    const loggedUser: UserEntity = {
      id: '1',
      fullName: 'Test User',
      email: 'user@example.com',
      dateOfBirth: '1999-01-01',
      password: currentPasswordHash,
    };

    vi.mocked(userRepository.findFullUserById).mockResolvedValue(loggedUser);

    const result = await service.execute(loggedUser, {
      oldPassword: 'WrongPass@123',
      password: 'NewPass@123',
      confirmPassword: 'NewPass@123',
    });

    expect(userRepository.updateUser).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 400,
      message: 'Incorrect old password',
    });
  });
});
