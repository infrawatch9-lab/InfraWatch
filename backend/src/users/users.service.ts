import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateTokens, verifyRefreshToken } from "../auth/jwt.service";
import { EmailService, generateTemporaryPassword } from "./email.service";
import {
  CreateUserDto,
  LoginDto,
  LoginResponse,
  UserResponseDto,
  RegisterUserDto,
  ResetPasswordDto,
} from "./user.entity";

const prisma = new PrismaClient();

export class UsersService {
  async registerWithTemporaryPassword(
    data: RegisterUserDto
  ): Promise<LoginResponse> {
    try {
      const { name, email, role = "USER" } = data;

      if (!name || !email) {
        return {
          success: false,
          message: "Nome e email são obrigatórios",
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          message: "Usuário já existe com este email",
        };
      }
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          isTemporaryPassword: true,
          temporaryPasswordExpiry: expiryDate,
        },
      });
      await EmailService.sendTemporaryPassword(email, name, temporaryPassword);
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message:
          "Conta criada com sucesso! Verifique seu email para a senha provisória.",
        user: {
          ...userWithoutPassword,
          isTemporaryPassword: true,
        },
      };
    } catch (error) {
      console.error("Erro no registro:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
      };
    }
  }

  async register(data: CreateUserDto): Promise<LoginResponse> {
    try {
      const { name, email, password, role = "USER" } = data;
      if (!name || !email || !password) {
        return {
          success: false,
          message: "Nome, email e password são obrigatórios",
        };
      }
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return {
          success: false,
          message: "Usuário já existe com este email",
        };
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        name: user.name,
      });

      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "Conta criada com sucesso",
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      console.error("Erro no registro:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
      };
    }
  }

  async login(data: LoginDto): Promise<LoginResponse> {
    try {
      const { email, password } = data;
      if (!email || !password) {
        return {
          success: false,
          message: "Email e password são obrigatórios",
        };
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          message: "Credenciais inválidas",
        };
      }

      // Verificar se a senha temporária expirou
      if (user.isTemporaryPassword && user.temporaryPasswordExpiry) {
        if (new Date() > user.temporaryPasswordExpiry) {
          return {
            success: false,
            message:
              "Senha provisória expirada. Entre em contato com o administrador.",
          };
        }
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Credenciais inválidas",
        };
      }

      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        name: user.name,
      });

      const { password: _, ...userWithoutPassword } = user;

      // Incluir informação sobre senha temporária na resposta
      const responseMessage = user.isTemporaryPassword
        ? "Login realizado! ATENÇÃO: Você deve alterar sua senha provisória."
        : "Login realizado com sucesso";

      return {
        success: true,
        message: responseMessage,
        user: {
          ...userWithoutPassword,
          isTemporaryPassword: user.isTemporaryPassword,
        },
        tokens,
      };
    } catch (error) {
      console.error("Erro no login:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
      };
    }
  }
  async refreshToken(refreshToken: string): Promise<Partial<LoginResponse>> {
    try {
      const { userId } = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        };
      }
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        name: user.name,
      });
      return {
        success: true,
        message: "Token renovado com sucesso",
        tokens,
      };
    } catch (error) {
      console.error("Erro no refresh token:", error);
      return {
        success: false,
        message: "Token de refresh inválido",
      };
    }
  }
  async findById(id: number): Promise<UserResponseDto | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  }
  async findAll(): Promise<UserResponseDto[]> {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return [];
    }
  }
  async create(data: CreateUserDto): Promise<UserResponseDto | null> {
    try {
      const { name, email, password, role = "USER" } = data;
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("Usuário já existe com este email");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return null;
    }
  }

  // Método para redefinir senha
  async resetPassword(
    userId: number,
    data: ResetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { currentPassword, newPassword } = data;

      if (!currentPassword || !newPassword) {
        return {
          success: false,
          message: "Senha atual e nova senha são obrigatórias",
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          message: "Nova senha deve ter pelo menos 6 caracteres",
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        };
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: "Senha atual incorreta",
        };
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e remover flag de senha temporária
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          isTemporaryPassword: false,
          temporaryPasswordExpiry: null,
          updatedAt: new Date(),
        },
      });

      // Enviar confirmação por email
      await EmailService.sendPasswordChanged(user.email, user.name);

      return {
        success: true,
        message: "Senha alterada com sucesso",
      };
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
      };
    }
  }
}

export const usersService = new UsersService();
