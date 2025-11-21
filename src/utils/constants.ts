// src/config/api.ts
export const API_BASE_URL = "http://localhost:3001/api/v1";
export const API_ENDPOINTS = {
  LOGIN: "/users/login",
  PROFILE: "/users/profile",
  REQUEST_PASSWORD_RESET: "/users/request-password-reset",
  RESET_PASSWORD_WITH_CODE: "/users/reset-password-with-code",
  REGISTER: "/users",
  USERS: "/users",
} as const;