import DataTable from '../../../components/table/DataTable.jsx'
import HeaderStatusPrjPerform from '../../../components/dropdown/filter/HeaderStatusPrjPerform.jsx'
import YearPrjPerform from '../../../components/dropdown/filter/YearPrjPerform.jsx'

export {
  DataTableChips,
  DataTableIdentity,
  DataTableStatus,
} from '../../../components/table/DataTable.jsx'

function resolveActionValue(value, row, index) {
  return typeof value === 'function' ? value(row, index) : value
}

function DataTableAction({
  columns = [],
  actions = [],
  actionColumnLabel = 'Action',
  actionColumnKey = 'action',
  actionCellClassName = 'users-table__action-cell',
  actionCellStyle = { width: '1%', whiteSpace: 'nowrap' },
  status,
  onStatusChange,
  year,
  onYearChange,
  ...props
}) {
  const actionColumn =
    actions.length > 0
      ? {
          key: actionColumnKey,
          header: actionColumnLabel,
          headerClassName: 'users-table__action-header',
          cellClassName: actionCellClassName,
          cellStyle: actionCellStyle,
          render: (row, index) => (
            <div className="users-table__action-group">
              {actions.map((action) => {
                if (resolveActionValue(action.hidden, row, index)) {
                  return null
                }

                const Icon = action.icon
                const buttonLabel = action.label ?? action.key ?? 'Action'
                
                return null // Placeholder as original code was incomplete
              })}
            </div>
          ),
        }
      : null

  return (
    <div className="users-table-shell">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem', gap: '1rem' }}>
        <YearPrjPerform value={year} onChange={onYearChange} />
        <HeaderStatusPrjPerform value={status} onChange={onStatusChange} />
      </div>
      <DataTable
        {...props}
        columns={actionColumn ? [...columns, actionColumn] : columns}
      />
    </div>
  )
}

export default DataTableAction

