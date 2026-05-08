  // src/components/report/YearFilter.jsx
  import React, { useMemo } from "react";
  import { TextField, Button, Stack } from "@mui/material";

  export default function YearFilter({
    year,
    onYearChange,
    loading = false,
    onApply,
    yearSpan = 5, // opsional: mau berapa tahun ke belakang
  }) {
    const yearOptions = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear; i >= currentYear - yearSpan; i--) years.push(i);
      return years;
    }, [yearSpan]);

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "flex-end" } }}
      >
        <TextField
          select
          label="Year"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 120 }}
          SelectProps={{ native: true }}
          disabled={loading}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </TextField>

        {!!onApply && (
          <Button
            variant="contained"
            onClick={onApply}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
          >
            Apply
          </Button>
        )}
      </Stack>
    );
  }
