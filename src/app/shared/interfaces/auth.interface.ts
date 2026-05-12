export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  message: string;
  jwt:     string;
}

export interface RefreshTokenResponse {
  jwt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface RestorePasswordRequest {
  email:       string;
  code:        string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
}