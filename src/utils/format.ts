import { ARABICNUMBERS } from "./constants.js";

export function convertToArabic(value: string | number, useArabic: boolean): string {
  if (!useArabic) return String(value);
  return String(value)
    .split("")
    .map((char) => {
      const digit = Number(char);
      return Number.isNaN(digit) ? char : ARABICNUMBERS[digit] ?? char;
    })
    .join("");
}

export function formatClockTime(date: Date, useArabic: boolean): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const h12 = hours % 12 || 12;
  const text = `${h12}:${minutes < 10 ? "0" : ""}${minutes}`;
  return convertToArabic(text, useArabic);
}
