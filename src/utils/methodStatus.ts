/**
 * Utilidades compartidas para el manejo de estados de métodos de estudio
 * Maneja la lógica de estados y progreso para Pomodoro, Mapas Mentales y Repaso Espaciado
 */

export type MethodStatus = 'en_progreso' | 'completado' | 'En_proceso' | 'Casi_terminando' | 'Terminado';

/**
 * Información de estado de método con etiqueta y color
 */
export interface MethodStatusInfo {
  status: MethodStatus;
  label: string;
  color: string;
}

/**
 * Mapeo estandarizado de estados que coincide con la validación del backend
 * Incluye estados para Pomodoro (inglés con guiones bajos) y Mapas Mentales (español con acentos)
 */
export const METHOD_STATUS: Record<string, MethodStatusInfo> = {
  // Estados de Pomodoro (inglés con guiones bajos)
  en_progreso: {
    status: 'en_progreso',
    label: 'En proceso',
    color: '#FACC15' // Amarillo
  },
  completado: {
    status: 'completado',
    label: 'Terminado',
    color: '#22C55E' // Verde
  },
  // Estados de Mapas Mentales (español con acentos)
  En_proceso: {
    status: 'En_proceso',
    label: 'En proceso',
    color: '#FACC15' // Amarillo
  },
  Casi_terminando: {
    status: 'Casi_terminando',
    label: 'Casi terminando',
    color: '#3B82F6' // Azul
  },
  Terminado: {
    status: 'Terminado',
    label: 'Terminado',
    color: '#22C55E' // Verde
  }
};

/**
 * Mapea el progreso a estado para Mapas Mentales
 * @param progress - Valor de progreso (20, 40, 60, 80, 100)
 * @returns Estado correspondiente del método
 */
export const getMindMapsStatusByProgress = (progress: number): MethodStatus => {
  if (progress === 20 || progress === 40) return 'En_proceso';
  if (progress === 60 || progress === 80) return 'Casi_terminando';
  if (progress === 100) return 'Terminado';
  return 'En_proceso'; // Valor por defecto
};

/**
 * Obtiene el color correspondiente a un estado
 * @param status - Estado del método
 * @returns Color hexadecimal del estado
 */
export const getStatusColor = (status: MethodStatus): string => {
  return METHOD_STATUS[status]?.color || METHOD_STATUS.En_proceso.color;
};

/**
 * Obtiene la etiqueta correspondiente a un estado
 * @param status - Estado del método
 * @returns Etiqueta descriptiva del estado
 */
export const getStatusLabel = (status: MethodStatus): string => {
  return METHOD_STATUS[status]?.label || METHOD_STATUS.En_proceso.label;
};

/**
 * Obtiene el color basado en el progreso para Mapas Mentales
 * @param progress - Valor de progreso
 * @returns Color correspondiente al progreso
 */
export const getMindMapsColorByProgress = (progress: number): string => {
  const status = getMindMapsStatusByProgress(progress);
  return getStatusColor(status);
};

/**
 * Obtiene la etiqueta basada en el progreso para Mapas Mentales
 * @param progress - Valor de progreso
 * @returns Etiqueta correspondiente al progreso
 */
export const getMindMapsLabelByProgress = (progress: number): string => {
  const status = getMindMapsStatusByProgress(progress);
  return getStatusLabel(status);
};

/**
 * Mapea el progreso a estado para Repaso Espaciado (igual que Mapas Mentales)
 * @param progress - Valor de progreso (20, 40, 60, 80, 100)
 * @returns Estado correspondiente del método
 */
export const getSpacedRepetitionStatusByProgress = (progress: number): MethodStatus => {
  if (progress === 20 || progress === 40) return 'En_proceso';
  if (progress === 60 || progress === 80) return 'Casi_terminando';
  if (progress === 100) return 'Terminado';
  return 'En_proceso'; // Valor por defecto
};

/**
 * Obtiene el color basado en el progreso para Repaso Espaciado
 * @param progress - Valor de progreso
 * @returns Color correspondiente al progreso
 */
export const getSpacedRepetitionColorByProgress = (progress: number): string => {
  const status = getSpacedRepetitionStatusByProgress(progress);
  return getStatusColor(status);
};

/**
 * Obtiene la etiqueta basada en el progreso para Repaso Espaciado
 * @param progress - Valor de progreso
 * @returns Etiqueta correspondiente al progreso
 */
export const getSpacedRepetitionLabelByProgress = (progress: number): string => {
  const status = getSpacedRepetitionStatusByProgress(progress);
  return getStatusLabel(status);
};

/**
 * Mapea el progreso a estado para Práctica Activa (igual que Repaso Espaciado)
 * @param progress - Valor de progreso (20, 40, 60, 80, 100)
 * @returns Estado correspondiente del método
 */
export const getActiveRecallStatusByProgress = (progress: number): MethodStatus => {
  if (progress === 20 || progress === 40) return 'En_proceso';
  if (progress === 60 || progress === 80) return 'Casi_terminando';
  if (progress === 100) return 'Terminado';
  return 'En_proceso'; // Valor por defecto
};

/**
 * Obtiene el color basado en el progreso para Práctica Activa
 * @param progress - Valor de progreso
 * @returns Color correspondiente al progreso
 */
export const getActiveRecallColorByProgress = (progress: number): string => {
  const status = getActiveRecallStatusByProgress(progress);
  return getStatusColor(status);
};

/**
 * Obtiene la etiqueta basada en el progreso para Práctica Activa
 * @param progress - Valor de progreso
 * @returns Etiqueta correspondiente al progreso
 */
export const getActiveRecallLabelByProgress = (progress: number): string => {
  const status = getActiveRecallStatusByProgress(progress);
  return getStatusLabel(status);
};

/**
 * Mapea el progreso a estado para Método Feynman (igual que otros métodos de pasos)
 * @param progress - Valor de progreso (20, 40, 60, 80, 100)
 * @returns Estado correspondiente del método
 */
export const getFeynmanStatusByProgress = (progress: number): MethodStatus => {
  if (progress === 20 || progress === 40) return 'En_proceso';
  if (progress === 60 || progress === 80) return 'Casi_terminando';
  if (progress === 100) return 'Terminado';
  return 'En_proceso'; // Valor por defecto
};

/**
 * Obtiene el color basado en el progreso para Método Feynman
 * @param progress - Valor de progreso
 * @returns Color correspondiente al progreso
 */
export const getFeynmanColorByProgress = (progress: number): string => {
  const status = getFeynmanStatusByProgress(progress);
  return getStatusColor(status);
};

/**
 * Obtiene la etiqueta basada en el progreso para Método Feynman
 * @param progress - Valor de progreso
 * @returns Etiqueta correspondiente al progreso
 */
export const getFeynmanLabelByProgress = (progress: number): string => {
  const status = getFeynmanStatusByProgress(progress);
  return getStatusLabel(status);
};

/**
 * Mapea el progreso a estado para Método Cornell (igual que otros métodos de pasos)
 * @param progress - Valor de progreso (20, 40, 60, 80, 100)
 * @returns Estado correspondiente del método
 */
export const getCornellStatusByProgress = (progress: number): MethodStatus => {
  if (progress === 20 || progress === 40) return 'En_proceso';
  if (progress === 60 || progress === 80) return 'Casi_terminando';
  if (progress === 100) return 'Terminado';
  return 'En_proceso'; // Valor por defecto
};

/**
 * Obtiene el color basado en el progreso para Método Cornell
 * @param progress - Valor de progreso
 * @returns Color correspondiente al progreso
 */
export const getCornellColorByProgress = (progress: number): string => {
  const status = getCornellStatusByProgress(progress);
  return getStatusColor(status);
};

/**
 * Obtiene la etiqueta basada en el progreso para Método Cornell
 * @param progress - Valor de progreso
 * @returns Etiqueta correspondiente al progreso
 */
export const getCornellLabelByProgress = (progress: number): string => {
  const status = getCornellStatusByProgress(progress);
  return getStatusLabel(status);
};

/**
 * Utilidades para detectar el tipo de método basado en el nombre
 */

/**
 * Verifica si un método es de Mapas Mentales
 * @param methodName - Nombre del método
 * @returns true si es un método de mapas mentales
 */
export const isMindMapsMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return name.includes('mapa') || name.includes('mentales') || name.includes('mind') || name.includes('map');
};

/**
 * Verifica si un método es de Pomodoro
 * @param methodName - Nombre del método
 * @returns true si es un método Pomodoro
 */
export const isPomodoroMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return name.includes('pomodoro') || name.includes('técnica pomodoro') || name.includes('pomodoro technique');
};

/**
 * Verifica si un método es de Repaso Espaciado
 * @param methodName - Nombre del método
 * @returns true si es un método de repaso espaciado
 */
export const isSpacedRepetitionMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return (name.includes('repaso') && name.includes('espaciado')) ||
         (name.includes('spaced') && name.includes('repetition')) ||
         name.includes('repetición espaciada');
};

/**
 * Verifica si un método es de Práctica Activa
 * @param methodName - Nombre del método
 * @returns true si es un método de práctica activa
 */
export const isActiveRecallMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return (name.includes('práctica') && name.includes('activa')) ||
         (name.includes('active') && name.includes('recall')) ||
         name.includes('recuerdo activo');
};

/**
 * Verifica si un método es del Método Feynman
 * @param methodName - Nombre del método
 * @returns true si es un método Feynman
 */
export const isFeynmanMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return name.includes('feynman') || name.includes('método feynman') || name.includes('feynman technique');
};

/**
 * Verifica si un método es del Método Cornell
 * @param methodName - Nombre del método
 * @returns true si es un método Cornell
 */
export const isCornellMethod = (methodName: string): boolean => {
  const name = methodName.toLowerCase();
  return name.includes('cornell') || name.includes('método cornell') || name.includes('cornell method');
};

/**
 * Obtiene el tipo de método desde los datos del método
 * @param method - Objeto con datos del método
 * @returns Tipo de método identificado
 */
export const getMethodType = (method: any): 'pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman' | 'cornell' | 'unknown' => {
  if (!method) return 'unknown';
  const name = method.nombre || method.nombre_metodo || method.titulo || '';
  if (isPomodoroMethod(name)) return 'pomodoro';
  if (isMindMapsMethod(name)) return 'mindmaps';
  if (isSpacedRepetitionMethod(name)) return 'spacedrepetition';
  if (isActiveRecallMethod(name)) return 'activerecall';
  if (isFeynmanMethod(name)) return 'feynman';
  if (isCornellMethod(name)) return 'cornell';
  return 'unknown';
};

/**
 * Utilidades de validación de progreso
 * Define los valores válidos de progreso para cada tipo de método
 */
export const VALID_PROGRESS_VALUES = {
  pomodoro: {
    creation: [20], // Actualizado: Pomodoro ahora inicia en 20% en lugar de 0%
    update: [20, 60, 100] // Actualizado: El flujo de progreso de Pomodoro es ahora 20→60→100
  },
  mindmaps: {
    creation: [20], // Los Mapas Mentales no pueden iniciar en 0%, deben iniciar en 20%
    update: [20, 40, 60, 80, 100]
  },
  spacedrepetition: {
    creation: [20], // El Repaso Espaciado sigue el modelo de Mapas Mentales
    update: [20, 40, 60, 80, 100]
  },
  activerecall: {
    creation: [20], // La Práctica Activa sigue el modelo de Repaso Espaciado
    update: [20, 40, 60, 80, 100]
  },
  feynman: {
    creation: [20], // El Método Feynman sigue el modelo de métodos de pasos múltiples
    update: [20, 40, 60, 80, 100]
  },
  cornell: {
    creation: [20], // El Método Cornell sigue el modelo de métodos de pasos múltiples
    update: [20, 40, 60, 80, 100]
  }
} as const;

/**
 * Valida si un valor de progreso es válido para la creación de sesión
 * @param progress - El valor de progreso a validar
 * @param methodType - El tipo de método ('pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman')
 * @returns true si es válido para creación, false en caso contrario
 */
export const isValidProgressForCreation = (progress: number, methodType: 'pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman' | 'cornell'): boolean => {
  const validValues = VALID_PROGRESS_VALUES[methodType].creation;
  return (validValues as readonly number[]).includes(progress);
};

/**
 * Valida si un valor de progreso es válido para la actualización de sesión
 * @param progress - El valor de progreso a validar
 * @param methodType - El tipo de método ('pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman')
 * @returns true si es válido para actualización, false en caso contrario
 */
export const isValidProgressForUpdate = (progress: number, methodType: 'pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman' | 'cornell'): boolean => {
  const validValues = VALID_PROGRESS_VALUES[methodType].update;
  return (validValues as readonly number[]).includes(progress);
};

/**
 * Obtiene el siguiente valor válido de progreso para un tipo de método
 * @param currentProgress - Valor actual de progreso
 * @param methodType - El tipo de método
 * @param direction - 'next' (siguiente) o 'prev' (anterior)
 * @returns El siguiente valor válido de progreso, o null si no hay disponible
 */
export const getNextValidProgress = (
  currentProgress: number,
  methodType: 'pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman' | 'cornell',
  direction: 'next' | 'prev' = 'next'
): number | null => {
  const validValues = VALID_PROGRESS_VALUES[methodType].update;
  const currentIndex = validValues.indexOf(currentProgress as any);

  if (currentIndex === -1) return null;

  if (direction === 'next' && currentIndex < validValues.length - 1) {
    return validValues[currentIndex + 1];
  } else if (direction === 'prev' && currentIndex > 0) {
    return validValues[currentIndex - 1];
  }

  return null;
};

/**
 * Valida el progreso para reanudar una sesión
 * @param progress - El valor de progreso de la sesión guardada
 * @param methodType - El tipo de método
 * @returns true si es válido para reanudar, false en caso contrario
 */
export const isValidProgressForResume = (progress: number, methodType: 'pomodoro' | 'mindmaps' | 'spacedrepetition' | 'activerecall' | 'feynman' | 'cornell'): boolean => {
  // Para reanudar, permitimos cualquier valor de actualización válido, pero no 0 para métodos que no son Pomodoro
  if ((methodType === 'mindmaps' || methodType === 'spacedrepetition' || methodType === 'activerecall' || methodType === 'feynman' || methodType === 'cornell') && progress === 0) return false;
  return isValidProgressForUpdate(progress, methodType);
};