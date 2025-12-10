export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  RegisterStep2: { password: string };
  Confirmation: undefined;

  // Home
  Home: undefined;
  Survey: undefined;
  Notifications: undefined;

  // Password Recovery
  ForgotPassword: undefined;
  ForgotPasswordCode: undefined;
  ForgotPasswordReset: undefined;

  // Métodos de estudio
  StudyMethods: undefined;

  // Pomodoro
  PomodoroIntro: { methodId: number; method?: any };
  PomodoroExecute: {
    methodId: number;
    resumeProgress?: number;
    sessionId?: string;
  };

  // Introducciones de métodos
  MindMapsIntro: { methodId: number };
  SpacedRepetitionIntro: { methodId: number };
  ActiveRecallIntro: { methodId: number };
  FeynmanIntro: { methodId: number };
  CornellIntro: { methodId: number };

  // PASOS de métodos (versión correcta)
  MindMapsSteps: { 
    methodId: number;
    progreso?: number;
    sessionId?: string;
  };
  SpacedRepetitionSteps: { 
    methodId: number;
    progreso?: number;
    sessionId?: string;
  };
  ActiveRecallSteps: { 
    methodId: number;
    progreso?: number;
    sessionId?: string;
  };
  FeynmanSteps: { 
    methodId: number;
    progreso?: number;
    sessionId?: string;
  };
  CornellSteps: { 
    methodId: number;
    progreso?: number;
    sessionId?: string;
  };

  // Pantalla general de pasos
  MethodSteps: { methodId: number };

  // Módulo de perfil
  Profile: undefined;

  // Música
  MusicAlbums: undefined;
  MusicSongs: { albumId: number; albumName?: string };

  // Sesiones rápidas
  QuickSession: undefined;

  // Reportes y Eventos
  Reports: undefined;
  Events: undefined;
};
