import { generatePingEmailTemplate } from '../templates/templateEmailPing';
import { EmailService } from '../email.service';
import { randomUUID } from 'crypto';

const formatDate = (dateString: string | Date | number) => {
    if (dateString === 'now') {
    dateString = new Date();
    }
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
    });
};

export async function sendPingAlert(alertData: any, alertID?: number) {
    try {
      console.log(`📧 [EmailService] Preparando alerta de ping para ${alertData.payload.serviceName}`);


        const templateData = {
            ...alertData.payload,
            alertId: alertID,
            formatDate: formatDate,
            dashboardUrl: process.env.DASHBOARD_URL || '#',
            serviceUrl: `${process.env.DASHBOARD_URL || '#'}/services/${encodeURIComponent(alertData.payload.serviceName)}`
        };

        const emailService = new EmailService();
        console.log(`receipients: ${alertData.payload.recipients}`);
        const toSend = await generatePingEmailTemplate(templateData);
        await emailService.send(
            `Alerta de Ping: ${alertData.payload.serviceName} está ${alertData.payload.status}`,
            `🚨 ALERTA: ${alertData.payload.serviceName} está ${alertData.payload.status}`,
            toSend,
            alertData.payload.recipients
        );
        console.log(`✅ [EmailService] Alerta de ping enviado com sucesso - ID: ${alertID}`);
        return alertID;
    } catch (error) {
      console.error('❌ [EmailService] Erro ao enviar alerta de ping:', error);
      throw {
        success: false,
        message: 'Erro ao enviar alerta de ping por email',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }