import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional Tailwind class values and resolves utility conflicts.
 * @param inputs - Class tokens, arrays, or conditional objects.
 * @returns A single normalized className string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
