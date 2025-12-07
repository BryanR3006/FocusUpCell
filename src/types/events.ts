/**
 * Event and calendar-related type definitions
 */

export interface IEvento {
  id: number;
  nombreEvento: string;
  descripcionEvento?: string;
  fechaEvento: string;
  horaEvento: string;
  tipoEvento: 'normal' | 'concentracion';
  estado: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  created_at?: string;
  updated_at?: string;
  // Nuevos campos para métodos de estudio
  metodosSeleccionados?: number[];
  albumSeleccionado?: number;
}

export interface IEventoCreate {
  nombreEvento: string;
  fechaEvento: string;
  horaEvento: string;
  descripcionEvento?: string;
  tipoEvento: 'normal' | 'concentracion';
  metodosSeleccionados?: number[];
  albumSeleccionado?: number;
}

export interface IEventoUpdate {
  nombreEvento?: string;
  fechaEvento?: string;
  horaEvento?: string;
  descripcionEvento?: string;
  tipoEvento?: 'normal' | 'concentracion';
  estado?: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  metodosSeleccionados?: number[];
  albumSeleccionado?: number;
}

export interface EventoConMetodos extends IEvento {
  metodos?: {
    id: number;
    nombre: string;
    descripcion: string;
    icono: string;
    color: string;
  }[];
  album?: {
    id: number;
    nombre: string;
    artista: string;
    genero: string;
    portada_url?: string;
  };
}