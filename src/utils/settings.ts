export const DEFAULT_IQAMA_OFFSETS = [20, 20, 15, 15, 5, 15];

export interface AppSettings {
  daylight: boolean;
  iqamaOffsets: number[];
  useArabicNumerals: boolean;
}

const STORAGE_KEY = "luxor-prayer-settings";

const DEFAULTS: AppSettings = {
  daylight: true,
  iqamaOffsets: [...DEFAULT_IQAMA_OFFSETS],
  useArabicNumerals: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, iqamaOffsets: [...DEFAULT_IQAMA_OFFSETS] };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      daylight: parsed.daylight ?? DEFAULTS.daylight,
      iqamaOffsets: parsed.iqamaOffsets?.length === 6
        ? parsed.iqamaOffsets
        : [...DEFAULT_IQAMA_OFFSETS],
      useArabicNumerals: parsed.useArabicNumerals ?? DEFAULTS.useArabicNumerals,
    };
  } catch {
    return { ...DEFAULTS, iqamaOffsets: [...DEFAULT_IQAMA_OFFSETS] };
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export interface WindowPosition {
  x: number;
  y: number;
}

export function loadWindowPosition(): WindowPosition | null {
  try {
    const raw = localStorage.getItem("luxor-window-position");
    if (!raw) return null;
    return JSON.parse(raw) as WindowPosition;
  } catch {
    return null;
  }
}

export function saveWindowPosition(pos: WindowPosition) {
  localStorage.setItem("luxor-window-position", JSON.stringify(pos));
}
