export const API_BASE_URL = "http://192.168.1.51:3001/api/v1";

export const API_ENDPOINTS = {
  // ---------------------------
  // AUTENTICACIÓN
  // ---------------------------
  REQUEST_VERIFICATION_CODE: "/auth/request-verification-code",
  VERIFY_CODE: "/auth/verify-code",
  REGISTER: "/auth/register",
  LOGIN: "/users/login",
  LOGOUT: "/users/logout",

  // ---------------------------
  // USUARIOS
  // ---------------------------
  USERS: "/users",
  PROFILE: "/users/profile",
  DELETE_ACCOUNT: "/users/delete",
  CHANGE_PASSWORD: "/users/change-password",
  REQUEST_PASSWORD_RESET: "/users/request-password-reset",
  RESET_PASSWORD_WITH_CODE: "/users/reset-password-with-code",

  // Sesiones por usuario (branch develop)
  USER_SESSIONS: "/users/:userId/sessions",

  // ---------------------------
  // MÉTODOS DE ESTUDIO
  // ---------------------------
  STUDY_METHODS: "/metodos-estudio",
  METHOD_BENEFITS: "/metodos-estudio/:id/beneficios",
  BENEFITS: "/beneficios",

  // ---------------------------
  // EVENTOS
  // ---------------------------
  EVENTS: "/eventos",
  EVENTS_CREATE: "/eventos/crear",
  EVENT_COMPLETE: "/eventos/:id/completed",
  EVENT_PENDING: "/eventos/:id/pending",

  // ---------------------------
  // SESIONES
  // ---------------------------
  SESSIONS: "/sessions",
  SESSION_DETAILS: "/sessions/:sessionId",
  SESSIONS_PENDING_AGED: "/sessions/pending/aged",
  SESSIONS_FROM_EVENT: "/sessions/from-event/:eventId",

  // ---------------------------
  // MÚSICA
  // ---------------------------
  MUSIC: "/musica",
  MUSIC_ALBUMS: "/musica/albums",
  MUSIC_ALBUM_SONGS: "/musica/albums/:id/canciones",
  MUSIC_SEARCH: "/musica/nombre/:nombre",
  MUSIC_ALBUM_SEARCH: "/musica/albums/nombre/:nombre",
  MUSIC_LIBRARY: "/musica", // (Features/Erickson - no duplicado)

  // ---------------------------
  // REPORTES
  // ---------------------------
  REPORTS: "/reports",
  ACTIVE_METHODS: "/reports/active-methods",
  METHOD_PROGRESS: "/reports/methods",
  METHOD_PROGRESS_UPDATE: "/reports/methods/:id/progress",
  SESSION_PROGRESS: "/reports/sessions",
  SESSION_PROGRESS_UPDATE: "/reports/sessions/:id/progress",
  USER_SESSIONS_REPORTS: "/reports/sessions",
  USER_METHODS_REPORTS: "/reports/methods",

  // ---------------------------
  // NOTIFICACIONES
  // ---------------------------
  NOTIFICATIONS_PREFERENCES: "/notificaciones/preferencias",
  NOTIFICATIONS_SCHEDULED: "/notificaciones/programadas",

  // ---------------------------
  // INTERESES & DISTRACCIONES
  // ---------------------------
  INTERESES: "/intereses",
  DISTRACCIONES: "/distracciones",

} as const;

