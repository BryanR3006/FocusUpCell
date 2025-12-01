/**
 * Notification-related type definitions
 */

export interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  prioridad: NotificationPriority;
  estado: NotificationStatus;
  fecha_creacion: string;
  fecha_lectura?: string;
  usuario_id: string;
  datos_adicionales?: Record<string, any>;
  acciones?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  etiqueta: string;
  tipo: ActionType;
  datos?: Record<string, any>;
}

export interface NotificationSettings {
  id: string;
  usuario_id: string;
  tipos_habilitados: NotificationType[];
  metodos_envio: DeliveryMethod[];
  silenciar_hasta?: string;
  zona_horaria: string;
}

export type NotificationType =
  | "sesion_completada"
  | "recordatorio_estudio"
  | "evento_proximo"
  | "logro_desbloqueado"
  | "sistema"
  | "musica_finalizada"
  | "metodo_recomendado";

export type NotificationPriority = "baja" | "normal" | "alta" | "urgente";

export type NotificationStatus = "enviada" | "leida" | "eliminada" | "archivada";

export type ActionType = "navegar" | "ejecutar" | "descartar" | "confirmar";

export type DeliveryMethod = "push" | "email" | "sms" | "in_app";