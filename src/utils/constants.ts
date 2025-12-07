export const API_BASE_URL = "http://192.168.1.51:3001/api/v1";

export const API_ENDPOINTS = {
  // Autenticación
  AUTH_REQUEST_CODE: "/auth/request-verification-code",
  AUTH_VERIFY_CODE: "/auth/verify-code",
  AUTH_REGISTER: "/auth/register",
  // Usuarios
  USERS: "/users",
  LOGIN: "/users/login",
  LOGOUT: "/users/logout",
  PROFILE: "/users",
  CHANGE_PASSWORD: "/users/change-password",
  REQUEST_PASSWORD_RESET: "/users/request-password-reset",
  RESET_PASSWORD_WITH_CODE: "/users/reset-password-with-code",
  USER_SESSIONS: "/users/:userId/sessions",
  
  // Métodos de estudio
  STUDY_METHODS: "/metodos-estudio",
  METHOD_BENEFITS: "/metodos-estudio/:id/beneficios",
  
  // Eventos
  EVENTS: "/eventos",
  EVENTS_CREATE: "/eventos/crear",
  EVENT_COMPLETE: "/eventos/:id/completed",
  EVENT_PENDING: "/eventos/:id/pending",
  
  // Música
  MUSIC: "/musica",
  MUSIC_ALBUMS: "/musica/albums",
  MUSIC_ALBUM_SONGS: "/musica/albums/:id/canciones",
  MUSIC_SEARCH: "/musica/nombre/:nombre",
  MUSIC_ALBUM_SEARCH: "/musica/albums/nombre/:nombre",
  
  // Reportes
  REPORTS: "/reports",
  ACTIVE_METHODS: "/reports/active-methods",
  METHOD_PROGRESS: "/reports/methods",
  METHOD_PROGRESS_UPDATE: "/reports/methods/:id/progress",
  SESSION_PROGRESS: "/reports/sessions",
  SESSION_PROGRESS_UPDATE: "/reports/sessions/:id/progress",
  USER_SESSIONS_REPORTS: "/reports/sessions",
  USER_METHODS_REPORTS: "/reports/methods",
  
  // Notificaciones
  NOTIFICATIONS_PREFERENCES: "/notificaciones/preferencias/:idUsuario",
  NOTIFICATIONS_SCHEDULED: "/notificaciones/programadas",
  
  // Sesiones
  SESSIONS: "/sessions",
  SESSION_DETAILS: "/sessions/:sessionId",
  SESSIONS_PENDING_AGED: "/sessions/pending/aged",
  SESSIONS_FROM_EVENT: "/sessions/from-event/:eventId",
  
  // Beneficios
  BENEFITS: "/beneficios",
  
  
} as const;