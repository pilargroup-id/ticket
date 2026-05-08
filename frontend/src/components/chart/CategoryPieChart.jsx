// src/components/chart/CategoryPieChart.jsx
import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// palette modern (mirip style chart lain)
const CHART_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#7c3aed",
  "#ea580c", "#0891b2", "#ca8a04", "#0f766e",
  "#9333ea", "#be123c", "#059669", "#4b5563",
];

const hashString = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const pickColorStable = (id, name) => {
  const key = `${id ?? ""}-${name ?? ""}`;
  return CHART_COLORS[hashString(key) % CHART_COLORS.length];
};

// helper persen
const pct = (part, total) => {
  if (!total) return "0%";
  const v = (part / total) * 100;
  // 0-9.9 -> 1 desimal, >=10 -> bulat
  return v < 10 ? `${v.toFixed(1)}%` : `${Math.round(v)}%`;
};

export default function CategoryPieChart({ data = [], loading = false }) {
  const theme = useTheme();
  const safe = Array.isArray(data) ? data : [];

  const rows = useMemo(() => {
    // sort biar legend & warna stabil
    return [...safe].sort((a, b) =>
      String(a?.category?.name || "").localeCompare(String(b?.category?.name || ""))
    );
  }, [safe]);

  const { labels, values, colors, total } = useMemo(() => {
    const labels = rows.map(
      (r) => r?.category?.name ?? `Category #${r?.category_id ?? "-"}`
    );
    const values = rows.map((r) => Number(r?.count ?? 0));
    const colors = rows.map((r, i) =>
      pickColorStable(r?.category_id ?? i, r?.category?.name ?? labels[i])
    );
    const total = values.reduce((a, b) => a + b, 0);
    return { labels, values, colors, total };
  }, [rows]);

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: "Tickets",
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          // border halus biar keliatan “slice”
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
          // bikin modern
          cutout: "70%",
          spacing: 3,
          borderRadius: 10,
          hoverOffset: 10,
        },
      ],
    };
  }, [labels, values, colors, theme.palette.background.paper]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: 10,
            font: { weight: "600" },
            color: theme.palette.text.secondary,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.label ? `${ctx.label}: ` : "";
              const val = Number(ctx.parsed ?? 0);
              return `${label}${val} (${pct(val, total)})`;
            },
          },
        },
      },
    }),
    [theme.palette.text.secondary, total]
  );

  if (loading) return <Box sx={{ height: 360 }} />;

  if (!values.length || total === 0) {
    return (
      <Box sx={{ height: 360, display: "grid", placeItems: "center" }}>
        <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: 13 }}>
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: { xs: 260, sm: 360 }, position: "relative" }}>
      {/* Center label */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, sm: 22 } }}>
            {total}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 12, color: "text.secondary" }}>
            total tickets
          </Typography>
        </Box>
      </Box>

      <Doughnut data={chartData} options={options} />
    </Box>
  );
}
