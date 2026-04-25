export interface LoginRequest {
  correo: string;
  contrasena: string;
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