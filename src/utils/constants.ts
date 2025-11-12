export const API_BASE_URL = "https://focusup-api.onrender.com/api/v1";

export const API_ENDPOINTS = {
  LOGIN: "/users/login",
  PROFILE: "/users/profile",
  REQUEST_PASSWORD_RESET: "/users/request-password-reset",
  RESET_PASSWORD_WITH_CODE: "/users/reset-password-with-code",
} as const;
