export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_000_000) {
      return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
    }
    if (amount >= 100_000) {
      return `₹${(amount / 100_000).toFixed(2)} L`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Reference "now" anchored to current operational timestamp: 2026-11-17T05:47:00-08:00 (2026-11-17T13:47:00Z)
const REF_NOW_MS = new Date('2026-11-17T13:47:00Z').getTime();

export function formatTimeElapsed(iso: string): string {
  const diffMs = Math.max(0, REF_NOW_MS - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return remMins > 0 ? `${hrs}h ${remMins}m ago` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h ago`;
}
