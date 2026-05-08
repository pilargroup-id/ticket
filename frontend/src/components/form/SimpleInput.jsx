import React from "react";
import { TextField } from "@mui/material";

export default function SimpleInput({
  value,
  onChange,
  placeholder = "",
  name,
  type = "text",
  disabled = false,
  error = false,
  helperText = "",
}) {
  const label = placeholder || "Input";

  return (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      name={name}
      type={type}
      label={label}              // ✅ placeholder dijadikan label
      placeholder={placeholder}  // tetep ada
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      error={error}
      helperText={helperText}
      InputLabelProps={{
        shrink: true,            // ✅ label selalu keliatan (gak ketiban)
      }}
      sx={{
        mb: 2,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          backgroundColor: "rgba(17,24,39,0.02)",
          "& fieldset": { borderColor: "rgba(17,24,39,0.14)" },
          "&:hover fieldset": { borderColor: "rgba(17,24,39,0.22)" },
          "&.Mui-focused fieldset": {
            borderColor: "primary.main",
            borderWidth: 2,
          },
        },
        "& .MuiInputLabel-root": {
          fontWeight: 800,
          color: "rgba(17,24,39,0.70)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "primary.main",
        },
      }}
    />
  );
}
