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

export async function sendEmail(to: string | string[], subject: string, text: string, html: string) {

  const info = await transporter.sendMail({
    from: '"InfraWatch" <kombagildo@gmail.com>',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: subject,
    text: text,
    html: html,
  });

  console.log('Email enviado:', info.messageId);
}

@Injectable()
export class EmailService {
  async send(message: string, subject: string, html: string, to: string | string[]) {
    console.log(`[EMAIL] Alerta enviado: ${message}`);
    console.log(`Enviando Email para: ${to}`);
    try {
      await sendEmail(Array.isArray(to) ? to : [to], subject, message, html);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  async sendAlert(type: 'PING' | 'SNMP' | 'HTTP' | 'WEBHOOK', data: any, alertID?: number) {
    try {
      switch (type) {
        case 'PING':
          console.log('📧 Enviando alerta de Ping...');
          break;
        case 'SNMP':
          console.log('🔧 Tipo de alerta "SNMP" ainda não implementado');
          break;
          
        case 'HTTP':
          console.log('🔧 Tipo de alerta "HTTP" ainda não implementado');
          break;
        case 'WEBHOOK':
          console.log('🔧 Tipo de alerta "WEBHOOK" ainda não implementado');
          break;
        default:
          throw new Error(`Tipo de alerta "${type}" não suportado`);
      }
    } catch (error) {
      console.error(`❌ [EmailService] Erro ao enviar alerta tipo "${type}":`, error);
      throw error;
    }
  }
}



