export function generatePingEmailTemplate({
    alert,
    serviceName,
    status,
    host,
    packetLoss,
    timestamp,
    dashboardUrl,
    serviceUrl,
    alertId,
    formatDate
}: {
    alert: { level: string; message: string; details?: { error?: string } };
    serviceName: string;
    status: string;
    host: string;
    packetLoss: number;
    timestamp: Date | string | number;
    dashboardUrl: string;
    serviceUrl: string;
    alertId: string;
    formatDate: (date: any) => string;
}) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>InfraWatch - Alerta de Serviço</title>
        <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 25px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .header p {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .alert-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                    margin: 20px 0 10px 0;
                }
                
                .alert-critical {
                    background-color: #fee;
                    color: #d32f2f;
                    border: 2px solid #ffcdd2;
                }
                
                .alert-warning {
                    background-color: #fff8e1;
                    color: #f57c00;
                    border: 2px solid #ffecb3;
                }
                
                .alert-info {
                    background-color: #e3f2fd;
                    color: #1976d2;
                    border: 2px solid #bbdefb;
                }
                
                .content {
                    padding: 30px 25px;
                }
                
                .service-info {
                    background-color: #f8f9fa;
                    border-left: 5px solid #667eea;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                
                .service-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .status-container {
                    display: flex;
                    align-items: center;
                    margin: 15px 0;
                    gap: 10px;
                }
                
                .status {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                
                .status-down {
                    background-color: #ffebee;
                    color: #c62828;
                    border: 2px solid #ef9a9a;
                }
                
                .status-up {
                    background-color: #e8f5e8;
                    color: #2e7d32;
                    border: 2px solid #a5d6a7;
                }
                
                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 25px 0;
                }
                
                .detail-card {
                    background-color: #ffffff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                
                .detail-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                
                .detail-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }
                
                .detail-host {
                    color: #667eea;
                    font-family: 'Courier New', monospace;
                }
                
                .packet-loss {
                    color: #d32f2f;
                    font-weight: 700;
                }
                
                .message-box {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                }
                
                .message-box h3 {
                    color: #856404;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                
                .message-box p {
                    color: #856404;
                    margin-bottom: 15px;
                }
                
                .error-details {
                    background-color: #ffebee;
                    border-left: 4px solid #f44336;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }
                
                .error-details strong {
                    color: #c62828;
                }
                
                .footer {
                    background-color: #f8f9fa;
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }
                
                .footer p {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                
                .btn {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 15px 10px 5px 0;
                }
                
                .btn-secondary {
                    background-color: #6c757d;
                }
                
                .timestamp-footer {
                    font-size: 12px;
                    color: #999;
                    margin-top: 15px;
                }
        </style>
</head>
<body>
        <div class="email-container">
                <div class="header">
                        <h1>🚨 InfraWatch</h1>
                        <p>Sistema de Monitoramento de Infraestrutura</p>
                        <div class="alert-badge alert-${alert.level}">
                                Alerta ${alert.level}
                        </div>
                </div>
                <div class="content">
                        <div class="service-info">
                                <div class="service-name">${serviceName}</div>
                                <div class="status-container">
                                        <span class="status status-${status.toLowerCase()}">${status}</span>
                                        <span style="color: #666; font-size: 14px;">Status alterado</span>
                                </div>
                        </div>
                        <div class="message-box">
                                <h3>📢 Mensagem do Alerta</h3>
                                <p>${alert.message}</p>
                                ${alert.details?.error ? `
                                <div class="error-details">
                                        <strong>Erro:</strong> ${alert.details.error}
                                </div>
                                ` : ''}
                        </div>
                        <div class="details-grid">
                                <div class="detail-card">
                                        <div class="detail-label">🌐 Host/IP</div>
                                        <div class="detail-value detail-host">${host}</div>
                                </div>
                                <div class="detail-card">
                                        <div class="detail-label">📊 Perda de Pacotes</div>
                                        <div class="detail-value packet-loss">${packetLoss}%</div>
                                </div>
                                <div class="detail-card">
                                        <div class="detail-label">⏰ Data/Hora</div>
                                        <div class="detail-value detail-timestamp">${formatDate(timestamp)}</div>
                                </div>
                                <div class="detail-card">
                                        <div class="detail-label">🔄 Nível do Alerta</div>
                                        <div class="detail-value">${alert.level}</div>
                                </div>
                        </div>
                        <div style="text-align: center; margin-top: 30px;">
                                <a href="${dashboardUrl}" class="btn">📊 Ver Dashboard</a>
                                <a href="${serviceUrl}" class="btn btn-secondary">🔧 Verificar Serviço</a>
                        </div>
                        ${status === 'DOWN' ? `
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #856404; margin-bottom: 15px;">💡 Ações Recomendadas</h3>
                                <ul style="color: #856404; padding-left: 20px;">
                                        <li>Verificar a conectividade de rede do host ${host}</li>
                                        <li>Confirmar se o serviço está rodando na máquina de destino</li>
                                        <li>Verificar configurações de firewall</li>
                                        <li>Analisar logs do sistema para identificar a causa</li>
                                        ${packetLoss === 100 ? `<li><strong>ATENÇÃO:</strong> 100% de perda de pacotes indica problemas críticos de conectividade</li>` : ''}
                                </ul>
                        </div>
                        ` : ''}
                </div>
                <div class="footer">
                        <p><strong>InfraWatch</strong> - Sistema de Monitoramento</p>
                        <p>Este é um alerta automático gerado pelo sistema de monitoramento.</p>
                        <p>Para dúvidas, entre em contato com a equipe de infraestrutura.</p>
                        <div class="timestamp-footer">
                                Email gerado em ${formatDate('now')} | ID do Alerta: ${alertId}
                        </div>
                </div>
        </div>
</body>
</html>
`;
}
