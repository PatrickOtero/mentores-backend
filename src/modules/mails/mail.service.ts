import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { handleError } from '../../shared/utils/handle-error.util';
import { EmailTemplateType } from './types/email-template.type';
import { MentorEntity } from '../mentors/entities/mentor.entity';
import { UserEntity } from '../user/entities/user.entity';
import { LoginTypeEnum } from '../auth/enums/login-type.enum';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async mentorSendEmailConfirmation(mentor: MentorEntity): Promise<void> {
    const { email, fullName, code } = mentor;
    const url = `${process.env.EMAIL_CONFIRMATION_URL}?code=${code}&email=${email}&type=${LoginTypeEnum.MENTOR}`;

    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Recuperação de Senha!',
        template: './send',
        context: {
          name: fullName,
          url,
        },
      })
      .catch(handleError);

    return;
  }

  async mentorSendCreationConfirmation(mentor: MentorEntity) {
    const { email, fullName, code } = mentor;
    const { EMAIL_CONFIRMATION_URL } = process.env;

    const url = `${EMAIL_CONFIRMATION_URL}?code=${code}&email=${email}&type=${LoginTypeEnum.MENTOR}`;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Confirme sua conta - SouJunior!',
          template: './confirmEmail',
          context: {
            name: fullName,
            url,
            email,
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async mentorSendRestorationEmail(mentorData: MentorEntity) {
    const { email, code } = mentorData;
    const { PASSWORD_RESTORATION_URL } = process.env;

    const url = `${PASSWORD_RESTORATION_URL}?code=${code}&email=${email}`;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Recuperação de conta - SouJunior!',
          template: './restoreEmail',
          context: {
            url,
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async mentorSendDeletionConfirmation(mentor: MentorEntity): Promise<void> {
    const { email, fullName } = mentor;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Exclusão de perfil confirmada - SouJunior',
          template: './profileDeletionConfirmation',
          context: {
            name: fullName,
            profileLabel: 'perfil de mentor(a)',
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async mentorSendPauseConfirmation(mentor: MentorEntity): Promise<void> {
    const { email, fullName } = mentor;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Perfil de mentor(a) pausado - SouJunior',
          template: './mentorProfileStatusNotification',
          context: {
            title: 'Perfil pausado com sucesso',
            name: fullName,
            description:
              'Seu perfil de mentor(a) foi pausado e deixou de aparecer nos resultados de busca da plataforma.',
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async mentorSendReactivationConfirmation(
    mentor: MentorEntity,
  ): Promise<void> {
    const { email, fullName } = mentor;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Perfil de mentor(a) reativado - SouJunior',
          template: './mentorProfileStatusNotification',
          context: {
            title: 'Perfil reativado com sucesso',
            name: fullName,
            description:
              'Seu perfil de mentor(a) foi reativado e voltou a aparecer nos resultados de busca da plataforma.',
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async userSendEmailConfirmation(user: UserEntity): Promise<void> {
    const { email, fullName, code } = user;
    const url = `${process.env.EMAIL_CONFIRMATION_URL}?code=${code}&email=${email}&type=${LoginTypeEnum.USER}`;

    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Recuperação de Senha!',
        template: './send',
        context: {
          name: fullName,
          url,
        },
      })
      .catch(handleError);

    return;
  }

  async userSendCreationConfirmation(user: UserEntity) {
    const { email, fullName, code } = user;
    const { EMAIL_CONFIRMATION_URL } = process.env;

    const url = `${EMAIL_CONFIRMATION_URL}?code=${code}&email=${email}&type=${LoginTypeEnum.USER}`;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Confirme sua conta - SouJunior!',
          template: './confirmEmail',
          context: {
            name: fullName,
            url,
            email,
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async userSendRestorationEmail(userData: UserEntity) {
    const { email, code } = userData;
    const { PASSWORD_RESTORATION_URL } = process.env;

    const url = `${PASSWORD_RESTORATION_URL}?code=${code}&email=${email}`;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Recuperação de conta - SouJunior!',
          template: './restoreEmail',
          context: {
            url,
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async userSendDeletionConfirmation(user: UserEntity): Promise<void> {
    const { email, fullName } = user;

    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Exclusão de perfil confirmada - SouJunior',
          template: './profileDeletionConfirmation',
          context: {
            name: fullName,
            profileLabel: 'perfil de mentorado(a)',
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async sendAccountDeletionConfirmation(
    email: string,
    profileLabel: string,
  ): Promise<void> {
    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Exclusão confirmada - SouJunior',
          template: './profileDeletionConfirmation',
          context: {
            name: 'usuário(a)',
            profileLabel,
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async userSendMentorshipFeedbackRequest({
    email,
    fullName,
    mentorName,
    sessionDate,
    feedbackUrl,
  }: {
    email: string;
    fullName: string;
    mentorName: string;
    sessionDate: Date | string;
    feedbackUrl: string;
  }) {
    try {
      await this.mailerService
        .sendMail({
          to: email,
          subject: 'Como foi sua mentoria? Queremos ouvir você',
          template: './mentorshipFeedbackRequest',
          context: {
            name: fullName,
            mentorName,
            feedbackUrl,
            sessionDate: new Date(sessionDate).toLocaleString('pt-BR'),
          },
        })
        .catch(handleError);
    } catch (error) {
      console.log(error.message);
    }

    return;
  }

  async sendEmail({ subject, template, context, email }: EmailTemplateType) {
    return; // remover depois que for resolvido
    await this.mailerService.sendMail({
      to: email,
      subject,
      template,
      context,
    });

    return;
  }
}
