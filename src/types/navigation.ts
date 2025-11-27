export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Confirmation: undefined;
  Survey: undefined;
  ForgotPassword: undefined;
  ForgotPasswordCode: undefined;
  ForgotPasswordReset: undefined;
  StudyMethods: undefined;
  PomodoroIntro: { methodId: number };
  MindMapsIntro: { methodId: number };
  SpacedRepetitionIntro: { methodId: number };
  ActiveRecallIntro: { methodId: number };
  FeynmanIntro: { methodId: number };
  CornellIntro: { methodId: number };
  MethodSteps: { methodId: number };
};