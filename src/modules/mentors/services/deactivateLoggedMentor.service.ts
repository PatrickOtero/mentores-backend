
import { MailService } from 'src/modules/mails/mail.service';
import { MentorRepository } from '../repository/mentor.repository';
import { Injectable, Logger } from '@nestjs/common';
import { MentorEntity } from '../entities/mentor.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DeactivateLoggedMentorService {
  constructor(private mentorRepository: MentorRepository) {}

  async execute(id: string): Promise<{ message: string }> {
    const mentorExists = await this.mentorRepository.findMentorById(id);

    if (!mentorExists) {
      return {
        message: 'Mentor not found',
      };
    }

    if (mentorExists.deleted) {
      return {
        message: 'This mentor is already deleted',
      };
    }

    await this.mentorRepository.deactivateMentorById(id);

      return { message: 'Account deactivated successfully' };
    } catch (error) {
      this.logger.error(
        `Falha ao executar desativação para mentor ${mentor.id}`,
        error,
      );
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeactivationNotifications() {
    try {
      const now = new Date();
      this.logger.log(
        `Verificacao diária de notificação iniciada: ${this.formatDateTime(
          now,
        )}`,
      );

      const deactivatedMentors =
        await this.mentorRepository.findDeactivatedMentors();

      for (const mentor of deactivatedMentors) {
        const daysSinceDeactivation = this.getDaysSinceDeactivation(
          new Date(mentor.updatedAt),
        );

        this.logger.log(
          `Mentor ${mentor.id} - Dias desde desativação: ${daysSinceDeactivation}`,
        );

        await this.processNotification(mentor, daysSinceDeactivation);
      }
    } catch (error) {
      this.logger.error(
        `Erro no processo de notificação de desativacao: `,
        error,
      );
    }
  }

  private async processNotification(
    mentor: MentorEntity,
    daysSince: number,
  ): Promise<void> {
    try {
      if (
        daysSince >= this.SECOND_NOTICE_DAYS &&
        daysSince < this.SECOND_NOTICE_DAYS + 1
      ) {
        this.logger.log(
          `Enviando segunda notificação para mentor ${mentor.id}`,
        );
        await this.mentorRepository.updateMentor(mentor.id, { deactivatedDays: daysSince});
        await this.mailService.mentorSendSecondDeactivationNotice(mentor);
      }

      if (
        daysSince >= this.THIRD_NOTICE_DAYS &&
        daysSince < this.THIRD_NOTICE_DAYS + 1
      ) {
        this.logger.log(
          `Enviando terceira notificação para mentor ${mentor.id}`,
        );
        await this.mentorRepository.updateMentor(mentor.id, { deactivatedDays: daysSince});
        await this.mailService.mentorSendThirdDeactivationNotice(mentor);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar notificações para mentor ${mentor.id}`,
        error,
      );
    }
  }

  private getDaysSinceDeactivation(deactivationDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - deactivationDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
