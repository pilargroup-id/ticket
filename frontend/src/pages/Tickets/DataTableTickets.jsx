import { useEffect, useMemo, useState } from 'react'

import DialogDelete from '../../components/dialog/DialogDelete.jsx'
import DialogEdit from '../../components/dialog/DialogEdit.jsx'
import DataTableAction, { DataTableStatus } from '../../components/table/DataTableAction.jsx'
import { Play, XClose } from '../../components/template/TemplateIcons.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  INITIAL_TICKET_ROWS as DEFAULT_TICKET_ROWS,
  PAGE_SIZE_OPTIONS,
  getFilteredTicketRows,
  getPaginationItems,
  getStatusVariant,
  getTicketEmptyMessage,
  getTicketPageRows,
  getTicketPaginationSummary,
  getTicketTableActions,
} from '../../services/my-tickets/DataTableMT.js'

export const INITIAL_TICKET_ROWS = DEFAULT_TICKET_ROWS

const columns = [
  {
    key: 'userName',
    header: 'user_name',
    accessor: 'userName',
    cellStyle: { minWidth: '180px' },
  },
  {
    key: 'requestDate',
    header: 'request_date',
    accessor: 'requestDate',
    cellStyle: { whiteSpace: 'nowrap', width: '12%' },
  },
  {
    key: 'namaPembuat',
    header: 'nama_pembuat',
    accessor: 'namaPembuat',
    cellStyle: { minWidth: '180px' },
  },
  {
    key: 'status',
    header: 'status',
    cellStyle: { whiteSpace: 'nowrap', width: '10%' },
    render: (ticket) => (
      <DataTableStatus inline variant={getStatusVariant(ticket.status)}>
        {ticket.status}
      </DataTableStatus>
    ),
  },
  {
    key: 'supportName',
    header: 'support_name',
    accessor: 'supportName',
    cellStyle: { minWidth: '180px' },
  },
  {
    key: 'solution',
    header: 'solution',
    accessor: 'solution',
    cellStyle: { minWidth: '260px' },
  },
]

function DataTableTickets({
  searchQuery = '',
  tableLabel = 'Tickets Overview table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  ticketRows = INITIAL_TICKET_ROWS,
  isLoading = false,
  errorMessage = '',
  refreshVersion = 0,
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
  const selectedTicketName =
    selectedTicket?.ticketCode ?? selectedTicket?.userName ?? selectedTicket?.id ?? 'ticket ini'
  const dialogTicket = selectedTicket ? { name: selectedTicketName } : null

  const openActionDialog = (dialogType, ticket) => {
    setSelectedTicket(ticket)
    setActiveActionDialog(dialogType)
  }

  const closeActionDialog = () => {
    setActiveActionDialog(null)
    setSelectedTicket(null)
  }

  const updateTicketStatus = (nextRawStatus, nextStatus) => {
    if (selectedTicket?.id && typeof setTicketRows === 'function') {
      setTicketRows((currentRows) =>
        currentRows.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, rawStatus: nextRawStatus, status: nextStatus }
            : ticket,
        ),
      )
    }

    closeActionDialog()
  }

  const handleExecutionConfirm = () => {
    updateTicketStatus('in_progress', 'In Progress')
  }

  const handleVoidConfirm = () => {
    updateTicketStatus('void', 'Void')
  }

  const tableActions = getTicketTableActions({
    onEdit: (ticket) => openActionDialog('execution', ticket),
    onDelete: (ticket) => openActionDialog('void', ticket),
    editKey: 'execution',
    editLabel: 'Execution',
    editIcon: Play,
    editDisabled: (ticket) => ticket?.rawStatus !== 'waiting',
    deleteKey: 'void',
    deleteLabel: 'Void',
    deleteIcon: XClose,
    deleteDisabled: (ticket) => ticket?.rawStatus === 'void',
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange.endDate, dateRange.startDate, pageSize, refreshVersion, searchQuery, statusFilter])

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
    ariaLabel: 'Tickets pagination',
    pageSizeAriaLabel: 'Jumlah baris ticket per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }
  const emptyMessage = isLoading
    ? 'Memuat data ticket...'
    : errorMessage || getTicketEmptyMessage({ searchQuery, dateRange, statusFilter })

  return (
    <div className="mtickets-table-shell">
      <DataTableAction
        className="mtickets-table"
        rows={rows}
        columns={columns}
        actions={tableActions}
        getRowId={(ticket) => ticket.id ?? ticket.ticketCode}
        tableLabel={tableLabel}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />

      <DialogEdit
        isOpen={activeActionDialog === 'execution'}
        eyebrow="Execution Ticket"
        title={`Execution ${selectedTicketName}`}
        description={
          <>
            Ticket <strong>{selectedTicketName}</strong> akan dipindahkan ke proses execution.
          </>
        }
        secondaryDescription="Status ticket akan diperbarui menjadi In Progress pada tabel aktif."
        confirmLabel="Execution"
        user={dialogTicket}
        onClose={closeActionDialog}
        onConfirm={handleExecutionConfirm}
      />

      <DialogDelete
        isOpen={activeActionDialog === 'void'}
        eyebrow="Void Ticket"
        title={`Void ${selectedTicketName}`}
        description={
          <>
            Apakah Anda yakin ingin mengubah <strong>{selectedTicketName}</strong> menjadi void?
          </>
        }
        secondaryDescription="Status ticket akan diperbarui menjadi Void pada tabel aktif."
        confirmLabel="Void"
        user={dialogTicket}
        onClose={closeActionDialog}
        onConfirm={handleVoidConfirm}
      />
    </div>
  )
}

export default DataTableTickets
