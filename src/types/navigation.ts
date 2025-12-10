export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  RegisterStep2: { password: string };
  Confirmation: undefined;
  Survey: undefined;
  Notifications: undefined;
  ForgotPassword: undefined;
  ForgotPasswordCode: undefined;
  ForgotPasswordReset: undefined;
  StudyMethods: undefined;
  
  // Métodos Pomodoro
  PomodoroIntro: { methodId: number; method?: any };
  PomodoroExecute: {
    methodId: number;
    resumeProgress?: number;
    sessionId?: string;
  };
  
  // Métodos de estudio - Introducción
  MindMapsIntro: { methodId: number };
  SpacedRepetitionIntro: { methodId: number };
  ActiveRecallIntro: { methodId: number };
  FeynmanIntro: { methodId: number };
  CornellIntro: { methodId: number };
  
  // Métodos de estudio - Pasos (ESTAS SON LAS QUE FALTAN)
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
  
  // Pantallas existentes
  MethodSteps: { methodId: number };
  Profile: undefined;
  MusicAlbums: undefined;
  MusicSongs: { albumId: number; albumName?: string };
  QuickSession: undefined;
  Reports: undefined;
  Events: undefined;
  sessions: undefined;
};