/**
 * StudyMethod-related type definitions
 */

export interface Benefit {
  id_beneficio: number;
  descripcion_beneficio: string;
}

export interface StudyMethod {
  id_metodo: number;
  nombre_metodo: string;
  titulo?: string;
  descripcion?: string;
  beneficios: Benefit[];
  icon?: string;
  icono?: string;
  color_hexa?: string;
  color?: string;
  url_imagen?: string;
  progreso?: number;
}

export interface StudyMethodProgress extends StudyMethod {
  progreso: number;
  status: "activo" | "completado" | "pausado";
}

export type StudyMethodStatus = "activo" | "completado" | "pausado" | "cancelado";