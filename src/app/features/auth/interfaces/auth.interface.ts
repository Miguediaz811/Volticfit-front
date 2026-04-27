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