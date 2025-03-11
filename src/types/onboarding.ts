
export type StudyEnvironment = 'office' | 'park' | 'home' | 'coffee-shop' | 'library';
export type SoundPreference = 'lo-fi' | 'ambient' | 'classical' | 'silence';
export type WorkStyle = 'pomodoro' | 'deep-work' | 'balanced';
export type UserGoal = 'deep-work' | 'study' | 'accountability';

export interface OnboardingState {
  step: number;
  userGoal?: UserGoal;
  workStyle?: WorkStyle;
  environment?: StudyEnvironment;
  soundPreference?: SoundPreference;
  isComplete: boolean;
}
