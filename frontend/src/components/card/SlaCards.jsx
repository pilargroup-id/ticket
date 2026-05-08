import React, { useMemo } from "react";
import { Box } from "@mui/material";
import StatisticCard from "./StatisticCard";

export default function SlaCards({ data, loading = false }) {
  const resolved = Number(data?.resolved ?? 0);
  const inSla = Number(data?.resolved_in_sla ?? 0);
  const percent = Number(data?.sla_percent ?? 0);
  const breached = Math.max(0, resolved - inSla);

  const items = useMemo(
    () => [
      { title: "Resolved", value: loading ? "..." : resolved },
      { title: "In SLA", value: loading ? "..." : inSla },
      { title: "Breached", value: loading ? "..." : breached },
      { title: "SLA %", value: loading ? "..." : percent, subtitle: "%" },
    ],
    [resolved, inSla, breached, percent, loading]
  );

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gap: { xs: 1, sm: 2 },
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))", // HP: 2 kolom
          sm: "repeat(4, minmax(0, 1fr))", // Desktop: 4 kolom full rata
        },
      }}
    >
      {items.map((it) => (
        <Box key={it.title} sx={{ minWidth: 0 }}>
          <StatisticCard
            title={it.title}
            value={it.value}
            subtitle={it.subtitle}
            sx={{ width: "100%" }} // ✅ paksa full
          />
        </Box>
      ))}
    </Box>
  );
}
