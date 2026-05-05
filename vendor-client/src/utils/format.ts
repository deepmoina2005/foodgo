export function currency(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function dateTime(value?: string | null) {
  if (!value) return 'Pending';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function titleCase(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function storageUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
  return `${base}/uploads/${path}`;
}