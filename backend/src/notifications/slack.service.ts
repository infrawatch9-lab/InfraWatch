import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SlackService {
  private webhookUrl = 

  constructor(private readonly httpService: HttpService) {}

  async send(message: string): Promise<void> {
    const payload = {
      text: message,
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.webhookUrl, payload),
      );
      console.log('[SLACK] Alerta enviado com sucesso');
    } catch (error) {
      if (error instanceof Error) {
        console.error('[SLACK] Falha ao enviar alerta:', error.message);
      } else {
        console.error('[SLACK] Falha ao enviar alerta:', error);
      }
    }
  }
}
