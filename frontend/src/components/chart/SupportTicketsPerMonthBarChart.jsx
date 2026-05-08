import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// palette biar ga abu2
const CHART_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#7c3aed",
  "#ea580c", "#0891b2", "#ca8a04", "#4b5563",
  "#0f766e", "#9333ea", "#be123c", "#059669",
];

const hashString = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const pickColorStable = (supportId, supportName) => {
  const key = `${supportId ?? ""}-${supportName ?? ""}`;
  const idx = hashString(key) % CHART_COLORS.length;
  return CHART_COLORS[idx];
};

export default function SupportTicketsPerMonthBarChart({ chart, loading }) {
  const labels = useMemo(() => {
    const labelsRaw = chart?.labels ?? [];
    if (!labelsRaw.length) return monthLabels;
    return labelsRaw.map((m, i) => monthLabels[(Number(m) || i + 1) - 1] || String(m));
  }, [chart?.labels]);

  const data = useMemo(() => {
    const series = chart?.series ?? [];
    if (!series.length) return null;

    // sort biar urutan legend stabil
    const sorted = [...series].sort((a, b) =>
      String(a?.support_name || "").localeCompare(String(b?.support_name || ""))
    );

    return {
      labels,
      datasets: sorted.map((s) => {
        const color = pickColorStable(s.support_id, s.support_name);
        return {
          label: s.support_name || `Support ${s.support_id ?? "-"}`,
          data: (s.data || []).map((v) => Number(v ?? 0)),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 7,
          maxBarThickness: 28,
        };
      }),
    };
  }, [chart, labels]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: 10,
            font: { weight: "600" },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label ? `${ctx.dataset.label}: ` : "";
              return `${label}${Number(ctx.parsed?.y ?? 0)} tiket`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: { precision: 0 },
        },
      },
    }),
    []
  );

  if (loading) return <Box sx={{ height: 360 }} />;

  if (!data) {
    return (
      <Box sx={{ height: 360, display: "grid", placeItems: "center" }}>
        <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: 13 }}>
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 360 }}>
      <Bar data={data} options={options} />
    </Box>
  );
}
