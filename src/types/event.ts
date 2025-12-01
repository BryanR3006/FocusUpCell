/**
 * Event and calendar-related type definitions
 */

export interface Event {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion?: string;
  tipo: EventType;
  prioridad: EventPriority;
  estado: EventStatus;
  recordatorio?: number; // minutos antes del evento
  notas?: string;
  color?: string;
  categoria_id?: string;
}

export interface EventCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
}

export interface Calendar {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  propietario_id: string;
  es_publico: boolean;
  eventos: Event[];
}

export interface EventReminder {
  id: string;
  evento_id: string;
  tipo: ReminderType;
  tiempo_antes: number; // minutos
  mensaje?: string;
  enviado: boolean;
}

export type EventType = "estudio" | "reunion" | "tarea" | "descanso" | "otro";

export type EventPriority = "baja" | "media" | "alta" | "urgente";

export type EventStatus = "pendiente" | "confirmado" | "cancelado" | "completado";

export type ReminderType = "notificacion" | "email" | "sms";