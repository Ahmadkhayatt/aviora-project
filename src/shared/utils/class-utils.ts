// Utility for conditionally joining classNames
// Combines clsx and tailwind-merge for conflict-free classes

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
