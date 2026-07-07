import 'dotenv/config';
import { MailerService } from '@nestjs-modules/mailer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../mail.service';

describe('MailService.calendlyUpdated', () => {
  let service: MailService;
  let mailerService: {
    sendMail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    expect(
      process.env.FRONTEND_URL?.trim(),
      'FRONTEND_URL must be defined and non-empty in the environment',
    ).toBeTruthy();

    mailerService = {
      sendMail: vi.fn().mockResolvedValue(undefined),
    };

    service = new MailService(mailerService as unknown as MailerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send the email with the correct template and context', async () => {
    await service.calendlyUpdated('mentor@email.com');

    expect(mailerService.sendMail).toHaveBeenCalledOnce();
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mentor@email.com',
        template: './calendlyUpdated',
        context: {
          urlHome: `${process.env.FRONTEND_URL}/home`,
        },
      }),
    );
  });

  it('should log errors without propagating them', async () => {
    const error = new Error('Falha ao enviar e-mail');
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    mailerService.sendMail.mockRejectedValue(error);

    await expect(
      service.calendlyUpdated('mentor@email.com'),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('Falha ao enviar e-mail');
  });
});
