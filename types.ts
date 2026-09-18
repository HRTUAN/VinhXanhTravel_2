
export interface UserData {
  name: string;
  phone: string;
  location: string;
  date: string;
  returnDate: string;
  pax: number;
}

export interface RegisterResponse {
  status: "ok" | "exists" | "error";
  userId?: string;
  winRate?: number;
  turns?: number;
  message?: string;
}

export interface SecretSheetData {
  percentages: number[]; // From Row 1 (A1, B1, C1)
  prizes: string[][];    // From Row 2 onwards, grouped by column
}

export interface SetupData {
  locations: string[];
  prizes: string[]; // Cột B
  prizesDetails: string[]; // Cột D
  messages: string[]; // Cột E
  forceSecret: boolean; // Cột F (ô F2)
  secretPrizes: {
    win100: SecretSheetData;
    win40: SecretSheetData;
    win30: SecretSheetData;
    win20: SecretSheetData;
  };
}

export interface PrizeInfo {
  prize: string;
  time: string;
}

export interface CheckPrizeResponse {
  status: "has_prize" | "no_prize" | "no_spin" | "not_found" | "error";
  message: string;
  name?: string;
  phone?: string;
  prizes?: PrizeInfo[];
  totalSpins?: number;
  remainingTurns?: number;
}

// Fixed SpinResponse to include 'extra_turn' as a valid result to resolve overlap error in App.tsx
export interface SpinResponse {
  result: "win" | "lose" | "none" | "error" | "extra_turn";
  remaining: number;
  message: string;
  prize?: string;
}

export enum AppStep {
  FORM = 'FORM',
  WHEEL = 'WHEEL'
}

export interface WheelSegment {
  label: string;
  color: string;
  isWin: boolean;
  isSecret?: boolean;
}