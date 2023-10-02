import { Dispatch, SetStateAction } from "react";

export type AnswerState = "c" | "e" | "w";
export type ForcedResult = [column: number, state: AnswerState];

export interface GameState {
  answers: string[];
  attempt: number;
  lastCompletedDate: number | null;
  enableHighContrast: boolean;
  enableHardMode: boolean;
  enableFreeEdit: boolean;
  enableLiarMode: boolean;
  lieBoxes: ForcedResult[];
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

export interface Game<T = GameState> {
  hash: string;
  num: number;
  readyState: "init" | "no-storage" | "ready";
  ready: boolean;
  state: T;
  migrate: (lastHash: string, state: T) => void;
  setState: Dispatch<SetStateAction<T>>;
  trackInvalidWord?: (word: string) => void;
  submitAnswer?: (answer: string, attempt: number) => void;
  resetState?: () => void;
}

export interface MigrationData {
  state: GameState;
  stats: GameStats;
  lastHash: string;
  time: number;
}

export interface LiveConfig {
  isHost: boolean;
  roomId: string;
  inviteKey: string;
}

interface StartEvent {
  type: "start";
  hash: string;
  num: number;
}

interface EmojiEvent {
  type: "emoji";
  emoji: string;
  username: string;
}

interface WinEvent {
  type: "win";
  username: string;
}

interface LoseEvent {
  type: "lose";
  answer: string;
}

export type LiveEvent = StartEvent | EmojiEvent | WinEvent | LoseEvent;
