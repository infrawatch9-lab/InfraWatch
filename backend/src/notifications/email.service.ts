import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kombagildo@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendEmail(to: string, subject: string, text: string, html: string) {

  const info = await transporter.sendMail({
    from: '"InfraWatch" <kombagildo@gmail.com>',
    to: to,
    subject: subject,
    text: text,
    html: html,
  });

  console.log('Email enviado:', info.messageId);
}

@Injectable()
export class EmailService {
  async send(message: string, subject: string, html: string, to: string) {
    console.log(`[EMAIL] Alerta enviado: ${message}`);
    try {
      await sendEmail(to, subject, message, html);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }
}



