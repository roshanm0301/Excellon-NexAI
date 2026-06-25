import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toCamelCase(s: string): string {
  return s
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("")
}

export function toKebabCase(s: string): string {
  return s
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join("-")
}
