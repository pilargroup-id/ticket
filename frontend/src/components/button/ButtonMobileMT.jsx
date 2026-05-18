import Box from '@mui/material/Box';
import { Ticket01 } from '../template/TemplateIcons.jsx';

export default function ButtonMobileMT({ onClickCreate }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className="users-table-card__action"
        onClick={onClickCreate}
        style={{
          minHeight: '34px',
          height: '34px',
          padding: '0 12px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 10px rgba(42, 157, 143, 0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        <Ticket01 size={14} aria-hidden="true" />
        <span>Create</span>
      </button>
    </Box>
  );
}