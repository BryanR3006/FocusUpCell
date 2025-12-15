export interface FocusModeConfig {
  blockApps: boolean;
  muteNotifications: boolean;
  blockedApps: string[]; // Android package names
  startTime: number; // timestamp
  endTime: number; // timestamp
}