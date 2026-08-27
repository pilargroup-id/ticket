import { useEffect, useState } from 'react'
import SkeletonLoading from '../../components/template/SkeletonLoading.jsx'

import ButtonRangeDate from '../../components/button/ButtonRangeDate.jsx'
import ButtonExport from '../../components/button/ButtonExport.jsx'
import { FileText01, Ticket01 } from '../../components/template/TemplateIcons.jsx'
import {
  exportTicketsByStatus,
  getTicketReport,
  getTicketStatusQueryValue,
  getTickets,
} from '../../services/tickets/Tickets.js'
import CardStatusTickets from './CardStatusTickets.jsx'
import DataTableTickets, { INITIAL_TICKET_ROWS } from './DataTableTickets.jsx'
import DialogCreateTicketAdmin from '../../components/dialog/DialogCreateTicketAdmin.jsx'

function TicketsOverview({ activePage, searchQuery, onLoadingChange }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [ticketRows, setTicketRows] = useState(INITIAL_TICKET_ROWS)
  const [statusCounts, setStatusCounts] = useState({})
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketsError, setTicketsError] = useState('')
  const [ticketRefreshVersion, setTicketRefreshVersion] = useState(0)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [exportingStatus, setExportingStatus] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadTickets() {
      setIsLoadingTickets(true)
      setTicketsError('')

      try {
        const response = await getTickets({
          status: getTicketStatusQueryValue(statusFilter),
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        if (!isMounted) {
          return
        }

        setTicketRows(response.data)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setTicketRows([])
        setTicketsError(error?.message || 'Gagal memuat data ticket.')
      } finally {
        if (isMounted) {
          setIsLoadingTickets(false)
        }
      }
    }

    loadTickets()

    return () => {
      isMounted = false
    }
  }, [dateRange.endDate, dateRange.startDate, statusFilter, ticketRefreshVersion])

  useEffect(() => {
    let isMounted = true

    async function loadTicketReport() {
      try {
        const response = await getTicketReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        if (!isMounted) {
          return
        }

        setStatusCounts(response.statusCounts)
      } catch {
        if (isMounted) {
          setStatusCounts({})
        }
      }
    }

    loadTicketReport()

    return () => {
      isMounted = false
    }
  }, [dateRange.endDate, dateRange.startDate, ticketRefreshVersion])

  const handleExportTickets = async (status) => {
    setExportingStatus(status)

    try {
      const exportedFile = await exportTicketsByStatus(status, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const url = URL.createObjectURL(exportedFile.blob)
      const link = document.createElement('a')

      link.href = url
      link.download = exportedFile.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to export ${status} tickets:`, error)
    } finally {
      setExportingStatus(null)
    }
  }

  const isPageLoading = isLoadingTickets && ticketRows.length === 0 && !ticketsError

  useEffect(() => {
    onLoadingChange?.(isPageLoading)

    return () => {
      onLoadingChange?.(false)
    }
  }, [isPageLoading, onLoadingChange])

  if (isPageLoading) {
    return <SkeletonLoading pageType="/TicketsOverview" />
  }

  return (
    <>
      <CardStatusTickets
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
      />

      <section
        className="dashboard-panel users-table-card mytickets-table-card"
        aria-label="Aktivitas legal"
      >
        <div className="users-table-card__header mytickets-table-card__header">
          <div className="mytickets-table-card__title-group">
            <h1 className="dashboard-panel__title mytickets-table-card__title">
              {activePage?.title ?? 'Tickets Overview'}
            </h1>
          </div>

          <div className="users-table-card__actions">
            <ButtonRangeDate label="Request Date" onChange={setDateRange} />

            <ButtonExport
              variant="action"
              className="users-table-card__action--secondary"
              onClick={() => handleExportTickets('feedback')}
              disabled={Boolean(exportingStatus)}
              aria-label="Export tickets dengan status feedback"
            >
              <FileText01 size={18} aria-hidden="true" />
              <span>{exportingStatus === 'feedback' ? 'Exporting...' : 'Export Feedback'}</span>
            </ButtonExport>

            <ButtonExport
              variant="action"
              className="users-table-card__action--secondary"
              onClick={() => handleExportTickets('waiting')}
              disabled={Boolean(exportingStatus)}
              aria-label="Export tickets dengan status waiting"
            >
              <FileText01 size={18} aria-hidden="true" />
              <span>{exportingStatus === 'waiting' ? 'Exporting...' : 'Export Waiting'}</span>
            </ButtonExport>

            <button
              type="button"
              className="users-table-card__action"
              onClick={() => setIsCreateDialogOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isCreateDialogOpen}
            >
              <Ticket01 size={18} aria-hidden="true" />
              <span>Create Tickets</span>
            </button>
          </div>
        </div>

        <DataTableTickets
          dateRange={dateRange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          ticketRows={ticketRows}
          isLoading={isLoadingTickets}
          errorMessage={ticketsError}
          refreshVersion={ticketRefreshVersion}
          setTicketRows={setTicketRows}
          refreshData={() => setTicketRefreshVersion((v) => v + 1)}
          tableLabel={`${activePage?.title ?? 'Tickets Overview'} table`}
        />
      </section>

      <DialogCreateTicketAdmin
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={(response) => {
          if (response?.data?.data) {
            setTicketRows((prev) => [response.data.data, ...prev])
          } else if (response?.data) {
            setTicketRows((prev) => [response.data, ...prev])
          }
          setTicketRefreshVersion((currentVersion) => currentVersion + 1)
        }}
      />
    </>
  )
}

export default TicketsOverview
