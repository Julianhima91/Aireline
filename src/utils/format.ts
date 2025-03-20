import { AuthError } from '@supabase/supabase-js';

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Format date to ISO string at noon UTC to avoid timezone issues
export function formatDateForAPI(date: Date): string {
  // Create a new date at noon UTC for the same calendar date
  const d = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0, 0
  ));
  return d.toISOString();
}

// Parse ISO date string to local date, preserving the exact calendar date
export function parseISODate(dateString: string): Date {
  const date = new Date(dateString);
  // Create a new date using local components to preserve the calendar date
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0, 0
  );
}

// Helper function to ensure data is serializable
export function makeCloneable<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error('Error making data cloneable:', err);
    return {} as T;
  }
}

// Helper function to format error messages for user display
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove technical details for user-facing messages
    return error.message
      .replace(/^TypeError: /, '')
      .replace(/^Error: /, '')
      .replace(/\s+\(.+\)$/, '')
      .replace('Failed to fetch', 'Network connection error. Please check your internet connection.');
  }
  if (error instanceof AuthError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}