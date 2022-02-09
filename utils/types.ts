export type AnswerState = "correct" | "exist" | "wrong" | null;

export interface GameState {
  answers: string[];
  attempt: number;
  lastCompletedDate: number | null;
  enableHighContrast: boolean;
  enableHardMode: boolean;
}

export interface GameStats {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    fail: number;
  };
  currentStreak: number;
  maxStreak: number;
}
