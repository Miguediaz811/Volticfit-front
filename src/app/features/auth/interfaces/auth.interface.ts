export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  jwt: string;
}

export interface MessageResponse {
  message: string;
}

export interface RefreshTokenResponse {
  jwt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  token: string;
}

export interface RestorePasswordRequest {
  email: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}