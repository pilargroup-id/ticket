import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputAdornment from '@mui/material/InputAdornment';
import { Filter } from '../../template/TemplateIcons.jsx';

export default function HeaderStatusPrjPerform({ value, onChange }) {
  const id = React.useId();

  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  return (
    <FormControl sx={{ minWidth: 180 }} size="small">
      <InputLabel
        id={`${id}-label`}
        sx={{
          fontSize: '0.875rem',
          color: '#64748b',
          backgroundColor: '#ffffff',
          px: 1,
          ml: -0.5,
          '&.Mui-focused': { color: '#10b981' }
        }}
      >
        Status
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value ?? ''}
        label="Status"
        onChange={handleChange}
        startAdornment={
          <InputAdornment position="start" sx={{ ml: 1, mr: 0.5 }}>
            <Filter size={16} color="#94a3b8" />
          </InputAdornment>
        }
        sx={{
          borderRadius: '999px', // Match range-date-button__trigger pill shape
          backgroundColor: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#1e293b',
          minHeight: '48px', // Match range-date-button__trigger
          transition: 'all 0.2s ease',
          boxShadow: '0 10px 22px rgba(26, 42, 87, 0.08)', // Match range-date-button__trigger
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
            borderWidth: '1px',
            borderRadius: '999px', // Ensure outline is also pill-shaped
          },
          '&:hover': {
            backgroundColor: '#f8fafc',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#cbd5e1',
            },
          },
          '&.Mui-focused': {
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#10b981',
              borderWidth: '1.5px',
            },
          },
          '& .MuiSelect-select': {
            py: 1.5, // Increased padding to fill 48px height
            pl: 1.5, // Space between icon and text
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}


        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: '12px',
              marginTop: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #f1f5f9',
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                mx: 0.5,
                my: 0.25,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#f0fdf4',
                  color: '#10b981',
                },
                '&.Mui-selected': {
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#059669',
                  },
                },
              },
            },
          },
        }}
      >
        <MenuItem value="">
          <em style={{ fontStyle: 'normal', opacity: 0.6 }}>Semua Status</em>
        </MenuItem>
        <MenuItem value="On Track">On Track</MenuItem>
        <MenuItem value="At Risk">At Risk</MenuItem>
        <MenuItem value="Delayed">Delayed</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
    </FormControl>
  );
}


