// src/types/user.ts
export interface User {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  pais?: string;
  genero?: string;
  fecha_nacimiento: Date;
  horario_fav?: string;
}

// CORRECCIÓN: Tu API espera "contrasena" no "password"
export interface LoginRequest {
  correo: string;
  contrasena: string; // ← CAMBIA "password" por "contrasena"
}

export interface RegisterRequest {
  nombre_usuario: string;
  correo: string;
  contrasena: string; 
  fecha_nacimiento: Date;
  pais?: string;
  genero?: string;
  horario_fav?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  userId: number;
  username: string;
  user: User;
  timestamp: string;
}