import { Fragment, isValidElement, useState, useEffect } from 'react'
import CreateButton from '../../../components/button/CreateButton.jsx'
import { ChevronDown } from '../../../components/template/TemplateIcons.jsx'
import SupportReports from '../../../services/reports/SupportReports.js'

function getInitials(value = '') {
    return String(value)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

function getDefaultRowId(row, index) {
    return row?.id ?? row?.userId ?? row?.key ?? index
}

function normalizeList(items) {
    if (!Array.isArray(items)) {
        return []
    }

    return items.map((item) => String(item).trim()).filter(Boolean)
}

function sanitizeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-') || 'row'
}

function resolveTemplateValue(value, row, index) {
    return typeof value === 'function' ? value(row, index) : value
}

function getColumnValue(column, row, index) {
    if (typeof column.render === 'function') {
        return column.render(row, index)
    }

    if (typeof column.accessor === 'function') {
        return column.accessor(row, index)
    }

    if (typeof column.accessor === 'string') {
        return row?.[column.accessor]
    }

    if (column.key) {
        return row?.[column.key]
    }

    return null
}

function renderBasicValue(value) {
    if (isValidElement(value)) {
        return value
    }

    if (Array.isArray(value)) {
        return <DataTableChips items={value} />
    }

    if (value === null) {
        return <span className="users-table__detail-value users-table__detail-value--muted">null</span>
    }

    if (value === undefined || value === '') {
        return <span className="users-table__detail-value users-table__detail-value--muted">-</span>
    }

    return value
}

export function DataTableStatus({
    children,
    variant = 'active',
    inline = false,
    className = '',
}) {
    const statusClassName = [
        'users-table__status',
        inline ? 'users-table__status--inline' : '',
        variant ? `users-table__status--${variant}` : '',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return <span className={statusClassName}>{children ?? '-'}</span>
}

export function DataTableChips({ items = [], empty = '-', variant = 'app', className = '' }) {
    const normalizedItems = normalizeList(items)

    if (normalizedItems.length === 0) {
        return <span className="users-table__apps-empty">{empty}</span>
    }

    return (
        <div className={['users-table__apps', className].filter(Boolean).join(' ')}>
            {normalizedItems.map((item, index) => (
                <DataTableStatus key={`${item}-${index}`} variant={variant} inline>
                    {item}
                </DataTableStatus>
            ))}
        </div>
    )
}

function InternalTable({
    rows = [],
    columns = [],
    getRowId = getDefaultRowId,
    tableLabel = 'Data table',
    tableMessage = '',
    emptyMessage,
    idPrefix = 'data-table',
    className = '',
}) {
    const resolvedEmptyMessage = emptyMessage ?? tableMessage ?? 'Belum ada data.'
    const colSpan = columns.length

    return (
        <div className={['users-table-wrapper', className].filter(Boolean).join(' ')}>
            <table className="users-table" aria-label={tableLabel}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key || column.header}
                                scope="col"
                                className={column.headerClassName}
                                style={column.headerStyle}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.length > 0 ? (
                        rows.map((row, index) => {
                            const rowId = getRowId(row, index)
                            const rowKey = String(rowId)

                            return (
                                <tr key={rowKey} className="users-table__row">
                                    {columns.map((column, colIdx) => (
                                        <td
                                            key={`${rowKey}-${column.key || colIdx}`}
                                            className={column.cellClassName}
                                            style={column.cellStyle}
                                        >
                                            {renderBasicValue(getColumnValue(column, row, index))}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={colSpan}>
                                <div className="users-table__empty">{resolvedEmptyMessage}</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default function DataTableDetailTP({ supportId, agentName, filters = {} }) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchData() {
            if (!supportId) return
            setRows([]) // Clear rows when fetching new data
            setLoading(true)
            try {
                const response = await SupportReports.getSupportTicketsDetail(supportId, {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    status: filters.status || 'all'
                })
                setRows(response.data)
            } catch (error) {
                console.error('Failed to fetch ticket details:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supportId, filters.startDate, filters.endDate, filters.status])

    const columns = [
        { header: "Code", accessor: "ticket_code" },
        { header: "User", accessor: "user_name" },
        { header: "Category", accessor: "category_name" },
        { 
          header: "Status", 
          accessor: "status",
          render: (row) => (
            <span className={`users-table__status users-table__status--${row.status.toLowerCase().replace(' ', '-')}`}>
              {row.status}
            </span>
          )
        },
        { header: "Time", accessor: "time_spent", render: (row) => `${row.time_spent}m` },
        { 
          header: "Problem", 
          accessor: "problem",
          cellStyle: { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        },
        { 
          header: "Solution", 
          accessor: "solution",
          cellStyle: { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        },
        { 
          header: "Late", 
          accessor: "is_late",
          render: (row) => (
            <span className={`users-table__status users-table__status--${row.is_late ? 'late' : 'on-time'}`}>
              {row.is_late ? 'Late' : 'On Time'}
            </span>
          )
        },
        { header: "Created", accessor: "created_at" },
    ]

    return (
        <InternalTable 
            columns={columns}
            rows={rows}
            tableLabel={`Tickets for ${agentName}`}
            tableMessage={loading ? "Loading data..." : "Belum ada data tiket."}
        />
    )
}
