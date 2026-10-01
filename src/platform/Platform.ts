export interface Platform {
  init(): Promise<void>;
  loadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(): Promise<void>;
  rewardedBreak(): Promise<boolean>;
  isAdPlaying(): boolean;
  saveData(key: string, value: string): Promise<void>;
  loadData(key: string): Promise<string | null>;
}
