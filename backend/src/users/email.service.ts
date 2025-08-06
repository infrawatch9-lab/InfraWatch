export class EmailService {
  static async sendTemporaryPassword(
    email: string,
    name: string,
    temporaryPassword: string
  ) {
    try {
      console.log("\n📧 ===== EMAIL ENVIADO =====");
      console.log(`📮 Para: ${email}`);
      console.log(`👤 Nome: ${name}`);
      console.log(`📋 Assunto: Bem-vindo ao InfraWatch - Senha Provisória`);
      console.log("📄 Conteúdo:");
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     🚀 BEM-VINDO AO INFRAWATCH               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ Olá ${name},                                                 ║
║                                                              ║
║ Sua conta foi criada com sucesso!                            ║
║                                                              ║
║ 🔐 CREDENCIAIS DE ACESSO:                                    ║
║                                                              ║
║    Email: ${email}                                           ║
║    Senha Provisória: ${temporaryPassword}                    ║
║                                                              ║
║ ⚠️  IMPORTANTE:                                              ║
║ • Esta é uma senha PROVISÓRIA                                ║
║ • Você DEVE alterar sua senha no primeiro login              ║
║ • A senha provisória expira em 24 horas                      ║
║                                                              ║
║ 🌐 Acesse: http://localhost:3000/api/users/login             ║
║                                                              ║
║ 📞 Suporte: admin@infrawatch.com                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
      console.log("✅ Email enviado com sucesso!\n");

      return {
        success: true,
        message: "Email enviado com sucesso",
      };
    } catch (error) {
      console.error("❌ Erro ao simular envio de email:", error);
      return {
        success: false,
        message: "Erro ao enviar email",
      };
    }
  }

  // Simula envio de email de confirmação de mudança de senha
  static async sendPasswordChanged(email: string, name: string) {
    try {
      console.log("\n📧 ===== EMAIL ENVIADO =====");
      console.log(`📮 Para: ${email}`);
      console.log(`👤 Nome: ${name}`);
      console.log(`📋 Assunto: InfraWatch - Senha Alterada com Sucesso`);
      console.log("📄 Conteúdo:");
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🔐 SENHA ALTERADA                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ Olá ${name},                                                 ║
║                                                              ║
║ Sua senha foi alterada com sucesso!                          ║
║                                                              ║
║ 🕐 Data/Hora: ${new Date().toLocaleString("pt-BR")}          ║
║                                                              ║
║ Se você não fez esta alteração, entre em contato             ║
║ imediatamente com o suporte.                                 ║
║                                                              ║
║ 📞 Suporte: admin@infrawatch.com                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
      console.log("✅ Email de confirmação enviado!\n");

      return {
        success: true,
        message: "Email de confirmação enviado",
      };
    } catch (error) {
      console.error("❌ Erro ao enviar confirmação:", error);
      return {
        success: false,
        message: "Erro ao enviar confirmação",
      };
    }
  }
}

export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 6) {
      result += "-";
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
