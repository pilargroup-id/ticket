// src/components/report/reportFilterUtils.js

export const fmtDate = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const buildRangeFromPreset = (preset) => {
  const now = new Date();

  if (preset === "today") {
    return { start_date: fmtDate(now), end_date: fmtDate(now) };
  }
  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { start_date: fmtDate(d), end_date: fmtDate(d) };
  }
  if (preset === "this_month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start_date: fmtDate(s), end_date: fmtDate(e) };
  }
  if (preset === "last_month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start_date: fmtDate(s), end_date: fmtDate(e) };
  }
  if (preset === "this_year") {
    const s = new Date(now.getFullYear(), 0, 1);
    const e = new Date(now.getFullYear(), 11, 31);
    return { start_date: fmtDate(s), end_date: fmtDate(e) };
  }
  if (preset === "last_year") {
    const y = now.getFullYear() - 1;
    const s = new Date(y, 0, 1);
    const e = new Date(y, 11, 31);
    return { start_date: fmtDate(s), end_date: fmtDate(e) };
  }

  return null; // custom: caller handle
};
