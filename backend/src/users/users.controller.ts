import { Request, Response } from "express";
import { usersService } from "./users.service";
import { verifyToken, extractTokenFromHeader } from "./jwt.service";
import {
  CreateUserDto,
  LoginDto,
  JwtPayload,
  RegisterUserDto,
  ResetPasswordDto,
} from "./user.entity";

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class UsersController {
  async registerWithTempPassword(req: Request, res: Response) {
    try {
      const data: RegisterUserDto = req.body;
      const result = await usersService.registerWithTemporaryPassword(data);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const data: CreateUserDto = req.body;
      const result = await usersService.register(data);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data: LoginDto = req.body;
      const result = await usersService.login(data);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(401).json(result);
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token é obrigatório",
        });
      }
      const result = await usersService.refreshToken(refreshToken);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(401).json(result);
      }
    } catch (error) {
      console.error("Erro no refresh token:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }
      const user = await usersService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }
      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Erro ao obter perfil:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado: permissões de administrador requeridas",
        });
      }
      const users = await usersService.findAll();
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }
      if (!req.user || (req.user.id !== id && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
        });
      }
      const user = await usersService.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const data: ResetPasswordDto = req.body;
      const result = await usersService.resetPassword(req.user.id, data);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado: permissões de administrador requeridas",
        });
      }
      const data: CreateUserDto = req.body;
      const user = await usersService.create(data);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Erro ao criar usuário",
        });
      }
      return res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        user,
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: any) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso requerido",
      });
    }
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    const message = error.message || "Token inválido";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Autenticação requerida",
    });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado: permissões de administrador requeridas",
    });
  }
  next();
};

export const usersController = new UsersController();
