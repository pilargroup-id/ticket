import { useEffect, useMemo, useState } from 'react'

import DialogVoidTickets from '../../components/dialog/DialogVoidTickets.jsx'
import DialogExecutionTicket from '../../components/dialog/DialogExecutionTicket.jsx'
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
    header: 'username',
    accessor: 'userName',
    cellStyle: { minWidth: '180px' },
  },
  {
    key: 'requestDate',
    header: 'request date',
    accessor: 'requestDate',
    cellStyle: { minWidth: '130x' },
  },
  {
    key: 'namaPembuat',
    header: 'nama pembuat',
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
    header: 'support name',
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
  refreshData,
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

  const updateTicketStatus = (ticketId, updatedTicket) => {
    if (ticketId && typeof setTicketRows === 'function') {
      setTicketRows((currentRows) =>
        currentRows.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, ...updatedTicket }
            : ticket,
        ),
      )
    }

    // Refresh global data to update counts etc
    refreshData?.()
    closeActionDialog()
  }

  const handleExecutionConfirm = (updatedData) => {
    // If updatedData is provided (from the API response), use it to update the row
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, {
        ...updatedData,
        // Map raw status to display status if needed, or assume the API returns what we need
        status: updatedData.status === 'in_progress' ? 'In Progress' :
          updatedData.status === 'resolved' ? 'Resolved' :
            updatedData.status === 'waiting' ? 'Waiting' :
              updatedData.status === 'void' ? 'Void' : updatedData.status
      })
    } else {
      // Fallback for manual updates if API didn't return data
      updateTicketStatus(selectedTicket.id, { rawStatus: 'in_progress', status: 'In Progress' })
    }
  }

  const handleVoidConfirm = (updatedData) => {
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, {
        ...updatedData,
        status: updatedData.status === 'void' ? 'Void' : updatedData.status
      })
    } else {
      updateTicketStatus(selectedTicket.id, { rawStatus: 'void', status: 'Void' })
    }
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

      <DialogExecutionTicket
        isOpen={activeActionDialog === 'execution'}
        eyebrow="Execution Ticket"
        title={`Execution ${selectedTicketName}`}
        ticket={selectedTicket}
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

      <DialogVoidTickets
        isOpen={activeActionDialog === 'void'}
        eyebrow="Void Ticket"
        title={`Void ${selectedTicketName}`}
        ticket={selectedTicket}
        description={
          <>
            Apakah Anda yakin ingin mengubah <strong>{selectedTicketName}</strong> menjadi void?
          </>
        }
        secondaryDescription="Status ticket akan diperbarui menjadi Void pada tabel aktif."
        confirmLabel="Void"
        onClose={closeActionDialog}
        onConfirm={handleVoidConfirm}
      />
    </div>
  )
}

export default DataTableTickets
