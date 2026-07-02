import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomNotFoundException } from 'src/shared/exceptions/notFound.exception';
import { CustomBadRequestException } from 'src/shared/exceptions/badRequest.exception';
import { UpdateUserService } from '../../services/updateUser.service';
import { UserRepository } from '../../user.repository';

describe('UpdateUserService', () => {
  let service: UpdateUserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      findUserById: vi.fn(),
      updateUser: vi.fn(),
    } as any;

    service = new UpdateUserService(userRepository);
  });

  it('should throw when the user does not exist', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(null as any);

    await expect(service.execute('missing-id', {})).rejects.toThrow(
      new CustomNotFoundException('There are no User with that id'),
    );
  });

  it('should mark registerComplete when specialties and aboutMe are informed', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: '1',
    } as any);

    const result = await service.execute('1', {
      aboutMe: 'Quero evoluir como dev',
      specialties: ['Back-End'],
    });

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        aboutMe: 'Quero evoluir como dev',
        specialties: ['Back-End'],
        registerComplete: true,
      }),
    );
    expect(result).toEqual({
      message: 'The User was updated successfully',
      status: 200,
    });
  });

  it('should throw a bad request exception when the update fails', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: '1',
    } as any);
    vi.mocked(userRepository.updateUser).mockRejectedValue(new Error('db'));

    await expect(service.execute('1', {})).rejects.toThrow(
      new CustomBadRequestException('Something went wrong in the database'),
    );
  });
});
