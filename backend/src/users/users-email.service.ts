import { sendEmail } from '../notifications/email.service';

export class EmailService {
  static async sendTemporaryPassword(
    email: string,
    name: string,
    temporaryPassword: string,
  ) {
    try {
      await sendEmail(
        email,
        'BEM-VINDO AO INFRAWATCH',
        'InfraWatch - Senha Provisória',
        `
          <p>Olá ${name},</p>
          <p>Sua senha provisória é: <strong>${temporaryPassword}</strong></p>
          <p>Por favor, altere sua senha após o primeiro login.</p>
        `,
      );
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  static async sendPasswordChanged(email: string, name: string) {
    try {
      // to, subject, text, html
      await sendEmail(
        email,
        'InfraWatch - Senha Alterada com Sucesso',
        `
          <p>Olá ${name},</p>
          <p>Sua senha foi alterada com sucesso!</p>
          <p>Se você não fez esta alteração, entre em contato imediatamente com o suporte.</p>
        `,
        email,
      );
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
