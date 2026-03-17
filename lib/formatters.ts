export function formatCurrency(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1) {
    return `$${value.toFixed(decimals)}M`;
  }
  return `$${(value * 1000).toFixed(0)}K`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(decimals)}%`;
}

export function formatDelta(value: number, isPercent = false): string {
  const sign = value >= 0 ? '+' : '';
  if (isPercent) return `${sign}${value.toFixed(1)}%`;
  return `${sign}${value.toFixed(1)}`;
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = parseInt(mon, 10) - 1;
  return `${months[idx]} ${year.slice(2)}`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatNumber(value: number, unit: string): string {
  if (unit === '$M') return formatCurrency(value);
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'x') return `${value.toFixed(1)}x`;
  if (unit === 'months') return `${value.toFixed(1)} mo`;
  if (unit === '$') return `$${Math.round(value).toLocaleString()}`;
  if (value >= 1000) return value.toLocaleString();
  return value.toFixed(1);
}

export function formatProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date('2024-12-09');
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
