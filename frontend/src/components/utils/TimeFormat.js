export const minutesToHM = (totalMinutes) => {
  const m = Math.max(0, Number(totalMinutes || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;

  if (h <= 0) return `${r}m`;
  if (r <= 0) return `${h}h`;
  return `${h}h ${r}m`;
};

export const minutesToHoursDecimal = (totalMinutes) => {
  const m = Math.max(0, Number(totalMinutes || 0));
  return Math.round((m / 60) * 10) / 10; // 1 decimal
};
