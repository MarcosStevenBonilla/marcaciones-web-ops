export function parseSV(dateStr: string): Date {
  const [d, m, y, h, min, s] = dateStr.split(/[\/ :]/);
  return new Date(+y, +m - 1, +d, +h, +min, +s);
}

export function svDateToInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split(' ')[0].split('/');
  return `${y}-${m}-${d}`;
}
