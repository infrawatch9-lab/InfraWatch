import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from '../auth/jwt.service';
import { EmailService, generateTemporaryPassword } from './users-email.service';
import {
  CreateUserDto,
  LoginDto,
  LoginResponse,
  UserResponseDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './user.entity';

const prisma = new PrismaClient();

export class UsersService {
  async registerWithTemporaryPassword(data: RegisterUserDto): Promise<any> {
    try {
      const { name, email, number, role } = data;
      // Garante que o valor de role seja sempre maiúsculo e válido
      const validRoles = ['ADMIN', 'USER', 'VIEWER'];
      const roleValue =
        role && validRoles.includes(role.toUpperCase())
          ? role.toUpperCase()
          : 'USER';
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (!trimmedName || !trimmedEmail) {
        throw {
          success: false,
          message: 'Nome e email são obrigatórios',
          statusCode: 400,
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      console.log('Existing user:', existingUser);

      if (existingUser) {
        throw {
          success: false,
          message: 'Já existe uma conta com este email',
          statusCode: 409,
        };
      }
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);
      const user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          number: number?.trim(),
          role: roleValue as any, // or as Role if you have imported the Role type
          isTemporaryPassword: true,
          temporaryPasswordExpiry: expiryDate,
        },
      });
      await EmailService.sendTemporaryPassword(
        trimmedEmail ?? '',
        trimmedName ?? '',
        temporaryPassword,
      );
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message:
          'Conta criada com sucesso! Verifique seu email para a senha provisória.',
        user: {
          ...userWithoutPassword,
          isTemporaryPassword: true,
        },
      };
    } catch (error) {
      console.error('Erro no registro:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
        statusCode: 500,
      };
    }
  }

  async register(data: CreateUserDto): Promise<any> {
    try {
      const { name, email, password, number, role } = data;
      // Garante que o valor de role seja sempre maiúsculo e válido
      const validRoles = ['ADMIN', 'USER', 'VIEWER'];
      const roleValue =
        role && validRoles.includes(role.toUpperCase())
          ? role.toUpperCase()
          : 'USER';

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        throw {
          success: false,
          message: 'Nome, email e senha são obrigatórios',
          statusCode: 400,
        };
      }
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingUser) {
        throw {
          success: false,
          message: 'Já existe uma conta com este email',
          statusCode: 409,
        };
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          number: number?.trim(),
          role: roleValue as any, // or as Role if you have imported the Role type
        },
      });

      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'USER',
        name: user.name,
        status: user.status as 'ACTIVE' | 'INACTIVE',
      });

      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message: 'Conta criada com sucesso',
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      console.error('Erro no registro:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
        statusCode: 500,
      };
    }
  }

  async login(data: LoginDto): Promise<any> {
    try {
      const { email, password } = data;
      const email_trimmed = email.trim();
      const password_trimmed = password.trim();

      if (!email_trimmed || !password_trimmed) {
        throw {
          success: false,
          message: 'Email e senha são obrigatórios',
          statusCode: 400,
        };
      }

      console.log('Login attempt with:', {
        email: email_trimmed,
        password: password_trimmed,
      });
      const user = await prisma.user.findUnique({
        where: { email: email_trimmed },
      });

      if (!user) {
        console.log('User not found:', email_trimmed);
        throw {
          success: false,
          message: 'Email ou senha incorretos',
          statusCode: 401,
        };
      }

      console.log('User found:', {
        id: user.id,
        email: user.email,
        status: user.status,
      });

      if (user.status === 'INACTIVE') {
        throw {
          success: false,
          message:
            'Sua conta está inativa. Entre em contato com o administrador para reativá-la.',
          statusCode: 403,
        };
      }

      // Verificar se a senha temporária expirou
      if (user.isTemporaryPassword && user.temporaryPasswordExpiry) {
        if (new Date() > user.temporaryPasswordExpiry) {
          throw {
            success: false,
            message:
              'Sua senha provisória expirou. Entre em contato com o administrador para obter uma nova.',
            statusCode: 401,
          };
        }
      }

      const isPasswordValid = await bcrypt.compare(
        password_trimmed,
        user.password,
      );
      if (!isPasswordValid) {
        console.log('Password comparison failed for user:', email_trimmed);
        throw {
          success: false,
          message: 'Email ou senha incorretos',
          statusCode: 401,
        };
      }

      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'USER',
        name: user.name,
        status: user.status as 'ACTIVE' | 'INACTIVE',
      });

      const { password: _, ...userWithoutPassword } = user;

      // Incluir informação sobre senha temporária na resposta
      const responseMessage = user.isTemporaryPassword
        ? 'Login realizado! ATENÇÃO: Você deve alterar sua senha provisória.'
        : 'Login realizado com sucesso';

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
      console.error('Erro no login:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      // Caso contrário, crie um erro genérico estruturado
      throw {
        success: false,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
        statusCode: 500,
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
        throw {
          success: false,
          message: 'Token inválido ou usuário não encontrado',
          statusCode: 401,
        };
      }
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'USER',
        name: user.name,
        status: user.status as 'ACTIVE' | 'INACTIVE',
      });
      return {
        success: true,
        message: 'Token renovado com sucesso',
        tokens,
      };
    } catch (error) {
      console.error('Erro no refresh token:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Token inválido ou expirado',
        statusCode: 401,
      };
    }
  }

  async getProfile(userId: number): Promise<UserResponseDto | any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw {
        success: false,
        message: 'Erro ao buscar perfil do usuário',
        statusCode: 404,
      };
    }
  }

  async findById(id: number): Promise<UserResponseDto | any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw {
        success: false,
        message: 'Erro ao buscar usuário',
        statusCode: 404,
      };
    }
  }

  async findAll(): Promise<UserResponseDto[] | any> {
    try {
      return await prisma.user.findMany();
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw {
        success: false,
        message: 'Erro ao listar usuários',
        statusCode: 500,
      };
    }
  }

  async getAllUsers(): Promise<UserResponseDto[] | any[]> {
    try {
      return await prisma.user.findMany();
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw {
        success: false,
        message: 'Erro ao listar usuários',
        statusCode: 404,
      };
    }
  }

  async updateUser(data: UpdateUserDto): Promise<any> {
    try {
      const { name, email, number, role, isTemporaryPassword, status } = data;

      if (!data.id || !name || !email || !role || !status) {
        throw {
          success: false,
          message: 'ID, nome, email, cargo e status são obrigatórios',
          statusCode: 400,
        };
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !trimmedName) {
        throw {
          success: false,
          message: 'Nome e email são obrigatórios',
          statusCode: 400,
        };
      }

      let password: string | undefined = undefined;
      let temporaryPasswordExpiry: Date | undefined = undefined;
      if (isTemporaryPassword) {
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        password = hashedPassword;
        temporaryPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await EmailService.sendTemporaryPassword(
          trimmedEmail,
          trimmedName,
          temporaryPassword,
        );
      }

      if (trimmedName && trimmedName.length === 0) {
        throw {
          success: false,
          message: 'Nome não pode ser vazio',
          statusCode: 400,
        };
      }

      if (trimmedEmail && trimmedEmail.length > 0) {
        const existingUser = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });
        if (existingUser && existingUser.id !== data.id) {
          throw {
            success: false,
            message: 'Email já está em uso por outro usuário',
            statusCode: 409,
          };
        }
      }

      const updateData: any = {
        ...(name && { name: trimmedName }),
        ...(email && { email: trimmedEmail }),
        ...(number !== undefined && { number: number?.trim() || null }),
        ...(role && { role }),
        ...(isTemporaryPassword !== undefined && { isTemporaryPassword }),
        ...(status && { status }),
        updatedAt: new Date(),
      };

      if (password) {
        updateData.password = password;
        updateData.temporaryPasswordExpiry = temporaryPasswordExpiry;
      }

      const user = await prisma.user.update({
        where: { id: data.id },
        data: updateData,
        // select removido, retorna tudo
      });
      return user;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Erro ao atualizar usuário',
        statusCode: 500,
      };
    }
  }

  // Método para redefinir senha
  async resetPassword(
    userId: number,
    data: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { currentPassword, newPassword } = data;

      if (!currentPassword || !newPassword) {
        throw {
          success: false,
          message: 'Senha atual e nova senha são obrigatórias',
          statusCode: 400,
        };
      }

      if (newPassword.length < 6) {
        throw {
          success: false,
          message: 'A nova senha deve ter pelo menos 6 caracteres',
          statusCode: 400,
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw {
          success: false,
          message: 'Usuário não encontrado',
          statusCode: 404,
        };
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw {
          success: false,
          message: 'Senha atual incorreta',
          statusCode: 400,
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
        message: 'Senha alterada com sucesso',
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
        statusCode: 500,
      };
    }
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw {
          success: false,
          message: 'Usuário não encontrado',
          statusCode: 404,
        };
      }

      await prisma.user.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Usuário deletado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);

      // Se o erro já tem a estrutura esperada, propague-o
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      throw {
        success: false,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
        statusCode: 500,
      };
    }
  }
}

export const usersService = new UsersService();
