import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { FileText01, ChevronDown } from '../../../components/template/TemplateIcons.jsx';

export default function ExportPrjPerform() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (type) => {
    console.log(`Exporting as ${type}...`);
    handleClose();
    // Implementation for actual export would go here
  };

  return (
    <div>
      <Button
        id="export-button"
        aria-controls={open ? 'export-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        startIcon={<FileText01 size={18} />}
        endIcon={<ChevronDown size={16} />}
        sx={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderRadius: '999px',
          px: 3,
          py: 1.25,
          minHeight: '48px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 22px rgba(26, 42, 87, 0.08)',
          '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          },
          '& .MuiButton-startIcon': {
            color: '#10b981',
          },
          '& .MuiButton-endIcon': {
            color: '#94a3b8',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          },
        }}
      >
        Export
      </Button>
      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            marginTop: '8px',
            minWidth: '180px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            padding: '4px',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              borderRadius: '8px',
              px: 1.5,
              py: 1,
              mx: 0.5,
              my: 0.25,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f0fdf4',
                color: '#10b981',
                '& .MuiListItemIcon-root': {
                  color: '#10b981',
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon sx={{ minWidth: '36px !important' }}>
            <FileText01 size={18} color="#10b981" />
          </ListItemIcon>
          <ListItemText primary="Export to Excel" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon sx={{ minWidth: '36px !important' }}>
            <FileText01 size={18} color="#ef4444" />
          </ListItemIcon>
          <ListItemText primary="Export to PDF" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </div>
  );
}
