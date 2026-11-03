import type { Option } from '@/types';

/** Scheme dates are calendar dates stored at UTC midnight — always format in UTC. */
export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return 'Not verified';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', ...opts });
}

/** Timestamps (createdAt etc.) are formatted in the user's local time zone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDateTime(iso);
}

export function daysLabel(days: number | null): string {
  if (days === null) return 'Deadline not verified';
  if (days < 0) return `Closed ${Math.abs(days)} day${days === -1 ? '' : 's'} ago`;
  if (days === 0) return 'Last day today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function formatINR(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  return `₹${n.toLocaleString('en-IN')}`;
}

export function labelOf(options: Option[] | undefined, value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  return options?.find((o) => o.value === value)?.label ?? value;
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
