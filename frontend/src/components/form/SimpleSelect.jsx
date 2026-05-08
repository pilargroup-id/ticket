import React from "react";
import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";

export default function SimpleSelect({
  value,
  onChange,
  placeholder,
  options = [],
  disabled = false,
}) {
  const safeValue = value == null ? "" : String(value);

  return (
    <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={disabled}>
      <InputLabel>{placeholder}</InputLabel>

      <Select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)} // ✅ kirim value aja
        label={placeholder}
        sx={{ borderRadius: 2 }}
      >
        {options.map((opt) => (
          <MenuItem key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
