export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "USER";
}

export interface LoginDto {
  email: string;
  password: string;
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

export interface ResetPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterUserDto {
  name: string;
  email: string;
  role?: "ADMIN" | "USER";
}

export interface JwtPayload {
  id: number;
  userId: number;
  email: string;
  role: "ADMIN" | "USER";
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserResponseDto;
  tokens?: AuthTokens;
}
