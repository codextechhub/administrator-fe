import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name) return "";

  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2) // Limit to first 2 words
    .map((word) => word[0].toUpperCase())
    .join("");

  return initials;
}