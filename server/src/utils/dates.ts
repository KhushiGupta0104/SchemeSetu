/**
 * Date conventions used across SchemeSetu
 * ---------------------------------------
 * Scheme dates (opening date, deadline) are calendar dates in India. They are stored as
 * Date objects at 00:00:00.000 UTC for that calendar day (e.g. "2026-11-30" -> 2026-11-30T00:00:00Z).
 * "Today" is always computed in the Asia/Kolkata time zone, so day counts do not drift with
 * the server's location. A deadline remains open for the whole of its calendar day.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in India, as a UTC-midnight Date. */
export function todayIST(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

/** Normalises "YYYY-MM-DD", an ISO string or a Date to a UTC-midnight calendar date. */
export function toCalendarDate(input: string | Date): Date {
  const d =
    typeof input === 'string'
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00Z` : input)
      : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Whole days from today (IST) until the given calendar date; negative if in the past. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((toCalendarDate(date).getTime() - todayIST(now).getTime()) / DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Age in completed years on the given calendar day. */
export function ageOn(dateOfBirth: Date, on: Date = todayIST()): number {
  let age = on.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const m = on.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < dateOfBirth.getUTCDate())) age--;
  return age;
}
