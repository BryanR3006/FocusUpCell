import { apiClient } from '../clientes/apiClient';

/**
 * Valida si la contraseña cumple con los criterios de fortaleza requeridos.
 * Debe tener al menos 8 caracteres y contener al menos una letra mayúscula,
 * una minúscula, un dígito y un carácter especial.
 * @param password - La cadena de contraseña a validar.
 * @returns Verdadero si la contraseña es válida, falso en caso contrario.
 */
export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

/**
 * Valida si la dirección de correo electrónico cumple con el estándar RFC 5322.
 * @param email - La cadena de correo electrónico a validar.
 * @returns Verdadero si el correo es válido, falso en caso contrario.
 */
export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
}

/**
 * Valida si la fecha de nacimiento representa una edad entre 13 y 120 años
 * y no está en el futuro.
 * @param dob - La cadena de fecha de nacimiento en un formato parseable (ej. YYYY-MM-DD).
 * @returns Un mensaje de error si es inválida, null si es válida.
 */
export function validateDateOfBirth(dob: string): string | null {
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "Fecha de nacimiento inválida";
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age--;
  }
  if (age < 13) return "Debes tener al menos 13 años";
  if (age > 120) return "Edad no válida";
  if (date > now) return "La fecha de nacimiento no puede estar en el futuro";
  return null;
}

/**
 * Valida si el nombre de usuario tiene entre 3 y 20 caracteres y contiene
 * solo caracteres alfanuméricos, guiones bajos o guiones.
 * @param username - La cadena de nombre de usuario a validar.
 * @returns Verdadero si el nombre de usuario es válido, falso en caso contrario.
 */
export function validateUsername(username: string): boolean {
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(username);
}

/**
 * Valida si el nombre completo tiene entre 2 y 50 caracteres y contiene
 * solo letras y espacios.
 * @param fullName - La cadena de nombre completo a validar.
 * @returns Verdadero si el nombre completo es válido, falso en caso contrario.
 */
export function validateFullName(fullName: string): boolean {
  const regex = /^[a-zA-Z\s]{2,50}$/;
  return regex.test(fullName);
}

/**
 * Valida si el campo requerido no está vacío después de recortar espacios en blanco.
 * @param value - El valor de cadena a validar.
 * @returns Verdadero si el valor no está vacío, falso en caso contrario.
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Verifica si el nombre de usuario está disponible mediante una llamada a la API.
 * Devuelve verdadero si está disponible, falso si está tomado o en caso de error.
 * @param username - El nombre de usuario a verificar.
 * @returns Una promesa que se resuelve en verdadero si está disponible, falso en caso contrario.
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await apiClient.get(`/check-username?username=${encodeURIComponent(username)}`);
    return response.available === true;
  } catch (error) {
    console.error('Error al verificar la disponibilidad del nombre de usuario:', error);
    return false;
  }
}