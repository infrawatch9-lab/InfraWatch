import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  async send(message: string) {
    console.log(`[TELEGRAM] Alerta enviado: ${message}`);
    // Telegram Bot API futuramente
  }
}