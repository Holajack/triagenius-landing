
export type UserGoal = 'deep-work' | 'study' | 'accountability';
export type WorkStyle = 'pomodoro' | 'deep-work' | 'balanced';
export type StudyEnvironment = 'office' | 'park' | 'home' | 'coffee-shop' | 'library';
export type SoundPreference = 'lo-fi' | 'ambient' | 'classical' | 'silence';

export interface OnboardingState {
  step: number;
  userGoal?: UserGoal;
  workStyle?: WorkStyle;
  environment?: StudyEnvironment;
  environmentColor?: string;
  soundPreference?: SoundPreference;
  isComplete: boolean;
}
