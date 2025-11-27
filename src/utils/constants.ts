export const API_BASE_URL = "http://localhost:3001/api/v1";

export const API_ENDPOINTS = {
  HEALTH: "/health",
  USERS: "/users",
  LOGIN: "/users/login",
  LOGOUT: "/users/logout",
  PROFILE: "/users/profile",
  DELETE_ACCOUNT: "/users/delete",
  REQUEST_PASSWORD_RESET: "/users/request-password-reset",
  RESET_PASSWORD_WITH_CODE: "/users/reset-password-with-code",
  STUDY_METHODS: "/metodos-estudio",
  BENEFITS: "/beneficios",
  EVENTS: "/eventos",
  REPORTS: "/reports",
  ACTIVE_METHODS: "/reports/active-methods",
  METHOD_PROGRESS: "/reports/methods",
  SESSION_PROGRESS: "/reports/sessions",
  NOTIFICATIONS_PREFERENCES: "/notificaciones/preferencias",
  NOTIFICATIONS_SCHEDULED: "/notificaciones/programadas",
} as const;