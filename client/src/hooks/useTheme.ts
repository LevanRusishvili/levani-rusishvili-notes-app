import { useEffect, useState } from "react";
import type { ColorTheme, FontTheme } from "../types";

const COLOR_KEY = "notes.colorTheme";
const FONT_KEY = "notes.fontTheme";

const COLOR_THEMES: readonly ColorTheme[] = ["light", "dark", "system"];
const FONT_THEMES: readonly FontTheme[] = ["sans", "serif", "mono"];

function readStored<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode etc.) - the theme just won't persist
  }
}

export function useTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() =>
    readStored(COLOR_KEY, COLOR_THEMES, "system"),
  );
  const [fontTheme, setFontTheme] = useState<FontTheme>(() =>
    readStored(FONT_KEY, FONT_THEMES, "sans"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    store(COLOR_KEY, colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.dataset.font = fontTheme;
    store(FONT_KEY, fontTheme);
  }, [fontTheme]);

  return { colorTheme, setColorTheme, fontTheme, setFontTheme };
}
