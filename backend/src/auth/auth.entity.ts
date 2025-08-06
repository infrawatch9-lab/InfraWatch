export interface JwtPayload {
    id: number;
    userId: number;
    email: string;
    role: "ADMIN" | "USER";
    status: "ACTIVE" | "INACTIVE";
    name: string;
    iat?: number;
    exp?: number;
    host?: string;
}

export interface JwtPayloadAgent {
    host: string;
    iat?: number;
    exp?: number;
}

export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
  isTemporaryPassword?: boolean;
}

export interface Request {
  user?: JwtPayload;
}

export interface AuthAgentTokens {
  accessToken: string;
  expiresIn: number;
}