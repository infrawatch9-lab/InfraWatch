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
  async registerWithTemporaryPassword(
    data: RegisterUserDto,
  ): Promise<any> {
    try {
      const { name, email, role = 'USER' } = data;
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (!trimmedName || !trimmedEmail) {
        throw new Error('Nome e email são obrigatórios');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      console.log('Existing user:', existingUser);

      if (existingUser) {
        throw new Error('Usuário já existe com este email');
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
          role,
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
      throw new Error('Erro interno do servidor');
    }
  }

  async register(data: CreateUserDto): Promise<any> {
    try {
      const { name, email, password, role = 'USER' } = data;

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        throw new Error('Nome, email e password são obrigatórios');
      }
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          role,
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
      throw new Error('Erro interno do servidor');
    }
  }

  async login(data: LoginDto): Promise<any> {
    try {
      const { email, password } = data;
      const email_trimmed = email.trim();
      const password_trimmed = password.trim();

      if (!email_trimmed || !password_trimmed) {
        throw new Error('Email e password são obrigatórios');
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
        throw new Error('Usuário não encontrado');
      }

      console.log('User found:', {
        id: user.id,
        email: user.email,
        status: user.status,
      });

      if (user.status === 'INACTIVE') {
        throw new Error('Conta inativa. Entre em contato com o administrador.');
      }

      // Verificar se a senha temporária expirou
      if (user.isTemporaryPassword && user.temporaryPasswordExpiry) {
        if (new Date() > user.temporaryPasswordExpiry) {
          throw new Error('Senha provisória expirada. Entre em contato com o administrador.');
        }
      }

      const isPasswordValid = await bcrypt.compare(
        password_trimmed,
        user.password,
      );
      if (!isPasswordValid) {
        console.log('Password comparison failed for user:', email_trimmed);
        throw new Error('Senha incorreta');
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
      throw new Error('Erro interno do servidor');
    }
  }

  async refreshToken(refreshToken: string): Promise<Partial<LoginResponse>> {
    try {
      const { userId } = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('Usuário não encontrado');
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
       throw new Error('Erro ao renovar token');
    }
  }

  async getProfile(userId: number): Promise<UserResponseDto | any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
      console.error('Erro ao buscar perfil do usuário:', error);
      throw new Error('Erro ao buscar perfil do usuário');
    }
  }

  async findById(id: number): Promise<UserResponseDto | any> {
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
      console.error('Erro ao buscar usuário:', error);
      throw new Error('Erro ao buscar usuário'); 
    }
  }

  async findAll(): Promise<UserResponseDto[] | any> {
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
      console.error('Erro ao listar usuários:', error);
      throw new Error('Erro ao listar usuários');
    }
  }

  async getAllUsers(): Promise<UserResponseDto[] | any[]> {
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
      console.error('Erro ao listar usuários:', error);
      throw new Error('Erro ao listar usuários');
    }
  }

  async updateUser(
    userId: number,
    data: UpdateUserDto,
  ): Promise<any> {
    try {
      const { name, email, role, isTemporaryPassword, status } = data;

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !trimmedName) {
        throw new Error('Nome e email são obrigatórios');
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
        throw new Error('Nome não pode ser vazio');
      }

      if (trimmedEmail && trimmedEmail.length === 0) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email já está em uso por outro usuário');
        }
      }

      const updateData: any = {
        ...(name && { name }),
        ...(email && { email }),
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
        where: { id: userId },
        data: updateData,
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
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Erro ao atualizar usuário');
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
        throw new Error('Senha atual e nova senha são obrigatórias');
      }

      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
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
      throw new Error('Erro interno do servidor');
    }
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
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
      throw new Error('Erro interno do servidor');
    }
  }
}

export const usersService = new UsersService();
