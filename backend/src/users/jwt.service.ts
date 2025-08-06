import * as jwt from "jsonwebtoken";
import { JwtPayload, AuthTokens } from "./user.entity";

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "infrawatch-secret-key-dev",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export const generateAccessToken = (
  payload: Omit<JwtPayload, "iat" | "exp">
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
}): AuthTokens => {
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60,
  };
};

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
