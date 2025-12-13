export interface User {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  pais?: string;
  genero?: string;
  fecha_nacimiento: Date;
  horario_fav?: string;
  intereses?: number[];
  distracciones?: string[];
  objetivo?: number;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  nombre_usuario: string;
  fecha_nacimiento: Date;
  pais?: string;
  genero?: string;
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
