import { useEffect, useMemo, useState } from 'react'

import CreateButton from '../../components/button/CreateButton.jsx'
import DialogDelete from '../../components/dialog/DialogDelete.jsx'
import DialogEdit from '../../components/dialog/DialogEdit.jsx'
import DialogTimelineMT from '../../components/dialog/DialogTimelineMT.jsx'
import DataTable, {
  DataTableIdentity,
  DataTableStatus,
} from '../../components/table/DataTable.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  INITIAL_TICKET_ROWS,
  PAGE_SIZE_OPTIONS,
  getFilteredTicketRows,
  getPaginationItems,
  getStatusVariant,
  getTicketEmptyMessage,
  getTicketPageRows,
  getTicketPaginationSummary,
  getTicketTimelineItems,
  getTicketTableActions,
} from '../../services/my-tickets/DataTableMT.js'

const columns = [
  {
    key: 'ticketCode',
    header: 'Ticket Code',
    accessor: 'ticketCode',
    cellStyle: { whiteSpace: 'nowrap', width: '11%' },
  },
  {
    key: 'category',
    header: 'Category',
    accessor: 'category',
    cellStyle: { whiteSpace: 'nowrap', width: '12%' },
  },
  {
    key: 'problem',
    header: 'Problem',
    accessor: 'problem',
    cellStyle: { minWidth: '320px' },
  },
  {
    key: 'requestDate',
    header: 'Request Date',
    accessor: 'requestDate',
    cellStyle: { whiteSpace: 'nowrap', width: '12%' },
  },
  {
    key: 'status',
    header: 'Status',
    cellStyle: { whiteSpace: 'nowrap', width: '10%' },
    render: (ticket) => (
      <DataTableStatus inline variant={getStatusVariant(ticket.status)}>
        {ticket.status}
      </DataTableStatus>
    ),
  },
  {
    key: 'priority',
    header: 'Priority',
    accessor: 'priority',
    cellStyle: { whiteSpace: 'nowrap', width: '9%' },
  },
  {
    key: 'support',
    header: 'Support',
    cellStyle: { minWidth: '220px' },
    render: (ticket) =>
      ticket.supportName ? <DataTableIdentity title={ticket.supportName} /> : '-',
  },
]

function DataTableMT({
  searchQuery = '',
  tableLabel = 'MyTickets table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  ticketRows = INITIAL_TICKET_ROWS,
  isLoading = false,
  errorMessage = '',
  setTicketRows,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [activeActionDialog, setActiveActionDialog] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const filteredRows = useMemo(
    () => getFilteredTicketRows(ticketRows, { searchQuery, dateRange, statusFilter }),
    [dateRange, searchQuery, statusFilter, ticketRows],
  )
  const { totalPages, safeCurrentPage, rows, firstItem, lastItem } = useMemo(
    () => getTicketPageRows(filteredRows, currentPage, pageSize),
    [currentPage, filteredRows, pageSize],
  )
  const selectedTicketName = selectedTicket?.ticketCode ?? selectedTicket?.id ?? 'ticket ini'
  const dialogTicket = selectedTicket ? { name: selectedTicketName } : null

  const openActionDialog = (dialogType, ticket) => {
    setSelectedTicket(ticket)
    setActiveActionDialog(dialogType)
  }

  const closeActionDialog = () => {
    setActiveActionDialog(null)
    setSelectedTicket(null)
  }

  const handleEditConfirm = () => {
    closeActionDialog()
  }

  const handleDeleteConfirm = () => {
    if (selectedTicket?.id && typeof setTicketRows === 'function') {
      setTicketRows((currentRows) =>
        currentRows.filter((ticket) => ticket.id !== selectedTicket.id),
      )
    }

    closeActionDialog()
  }

  const handleTimelineOpen = (ticket) => {
    setSelectedTicket(ticket)
    setActiveActionDialog('timeline')
  }

  const tableActions = getTicketTableActions({
    onEdit: (ticket) => openActionDialog('edit', ticket),
    onDelete: (ticket) => openActionDialog('delete', ticket),
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange.endDate, dateRange.startDate, pageSize, searchQuery, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pagination = {
    summary: getTicketPaginationSummary(firstItem, lastItem, filteredRows.length),
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'MyTickets pagination',
    pageSizeAriaLabel: 'Jumlah baris ticket per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }
  const emptyMessage = isLoading
    ? 'Memuat data ticket...'
    : errorMessage || getTicketEmptyMessage({ searchQuery, dateRange, statusFilter })

  const getTicketDetailSections = (ticket) => [
    {
      title: 'Informasi Ticket',
      fields: [
        { label: 'Ticket Code', value: ticket.ticketCode },
        { label: 'Requestor', value: ticket.requestor },
        { label: 'Category', value: ticket.category },
        { label: 'Request Date', value: ticket.requestDate },
        { label: 'Status', value: ticket.status },
        { label: 'Priority', value: ticket.priority },
        { label: 'Support', value: ticket.supportName || '-' },
        { label: 'Waiting Hour', value: ticket.waitingHour },
        { label: 'Time Spent', value: ticket.timeSpent },
        { label: 'Is Late', value: ticket.isLate },
        { label: 'Start Date', value: ticket.startDate },
        { label: 'End Date', value: ticket.endDate },
        { label: 'Last Updated', value: ticket.lastUpdated },
      ],
    },
    {
      title: 'Deskripsi',
      wide: true,
      fields: [
        { label: 'Problem', value: ticket.problem },
        { label: 'Solution', value: ticket.solution },
        { label: 'Notes', value: ticket.notes },
      ],
    },
  ]

  return (
    <div className="mtickets-table-shell">
      <DataTable
        className="mtickets-table"
        rows={rows}
        columns={columns}
        getRowId={(ticket) => ticket.id ?? ticket.ticketCode}
        tableLabel={tableLabel}
        detail={{
          columnLabel: 'Detail',
          buttonLabel: 'Detail',
          eyebrow: 'Ticket Code',
          title: (ticket) => ticket.ticketCode,
          sections: (ticket) => getTicketDetailSections(ticket),
          render: (ticket) => (
            <div className="mtickets-table__detail-actions">
              <p className="mtickets-table__detail-copy">
                Lihat riwayat perubahan status ticket beserta hari dan jam penanganannya.
              </p>
              <CreateButton
                variant="accordion"
                type="button"
                onClick={() => handleTimelineOpen(ticket)}
              >
                Lihat Timeline
              </CreateButton>
            </div>
          ),
        }}
        actions={tableActions}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />

      <DialogEdit
        isOpen={activeActionDialog === 'edit'}
        eyebrow="Edit Ticket"
        title={`Edit ${selectedTicketName}`}
        user={dialogTicket}
        onClose={closeActionDialog}
        onConfirm={handleEditConfirm}
      />

      <DialogDelete
        isOpen={activeActionDialog === 'delete'}
        eyebrow="Delete Ticket"
        title={`Delete ${selectedTicketName}`}
        user={dialogTicket}
        onClose={closeActionDialog}
        onConfirm={handleDeleteConfirm}
      />

      <DialogTimelineMT
        isOpen={activeActionDialog === 'timeline'}
        eyebrow="Timeline Ticket"
        title={`Timeline ${selectedTicketName}`}
        items={selectedTicket ? getTicketTimelineItems(selectedTicket) : []}
        onClose={closeActionDialog}
      />
    </div>
  )
}

export default DataTableMT
