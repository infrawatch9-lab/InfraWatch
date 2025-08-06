import * as jwt from "jsonwebtoken";
import { AuthAgentTokens, JwtPayload, JwtPayloadAgent } from "./auth.entity";
import { AuthTokens } from "../users/user.entity";
import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "infrawatch-secret-key-dev",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export const generateAccessToken = (
  payload: Omit<JwtPayload | JwtPayloadAgent, "iat" | "exp">
): string => {
  return jwt.sign(
    payload as any,
    JWT_CONFIG.secret as string,
    {
      expiresIn: JWT_CONFIG.expiresIn,
    } as any
  );
};

export const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: "refresh" } as any,
    JWT_CONFIG.secret as string,
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
    } as any
  );
};

export const generateTokens = (user: {
  id: number;
  email: string;
  role: "ADMIN" | "USER";
  name: string;
  status: "ACTIVE" | "INACTIVE";
}): AuthTokens => {
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    status: user.status,
  } as JwtPayload;

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60,
  };
};

export const generateAgentTokens = (agent: {
  host: string;
  exp?: number;
}): AuthAgentTokens => {
  const payload = {
    host: agent.host,
    iat: Math.floor(Date.now() / 1000),
    exp: agent.exp,
  } as JwtPayloadAgent;

  const accessToken = generateAccessToken(payload);

  return {
    accessToken,
    expiresIn: agent.exp ? Math.floor(Date.now() / 1000) + agent.exp : 30 * 24 * 60 * 60,
  };
};

export function generateAgentToken(host: string): string {
  return jwt.sign({ host }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
}

export function verifyTokenAgent(token: string): JwtPayloadAgent {
  if (!token) {
    throw new Error("Token is required");
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayloadAgent;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Agent Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid Agent token");
    }
    throw new Error("Agent Token verification failed");
  }
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret as string) as JwtPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret as string) as any;
    if (decoded.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }
    return { userId: decoded.userId };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    }
    throw new Error("Refresh token verification failed");
  }
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
};
