import { useEffect, useMemo, useState } from 'react'

import ButtonRangeDate from '../../components/button/ButtonRangeDate.jsx'
import { Ticket01 } from '../../components/template/TemplateIcons.jsx'
import { INITIAL_TICKET_ROWS } from '../../services/my-tickets/DataTableMT.js'
import { getMyTickets } from '../../services/my-tickets/MyTickets.js'
import CardStatusMT from './CardStatusMT.jsx'
import DataTableMT from './DataTableMT.jsx'
import DialogCreateTicket from '../../components/dialog/DialogCreateMT.jsx'

function MyTickets({ activePage, searchQuery }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [ticketRows, setTicketRows] = useState(INITIAL_TICKET_ROWS)
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketsError, setTicketsError] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    let isMounted = true

    async function loadMyTickets() {
      setIsLoadingTickets(true)
      setTicketsError('')

      try {
        const response = await getMyTickets()

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

    loadMyTickets()

    return () => {
      isMounted = false
    }
  }, [])

  const statusCounts = useMemo(
    () =>
      ticketRows.reduce((counts, ticket) => {
        counts[ticket.status] = (counts[ticket.status] ?? 0) + 1
        return counts
      }, {}),
    [ticketRows],
  )

  return (
    <>
      <CardStatusMT
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
              {activePage?.title ?? 'MyTickets'}
            </h1>
          </div>

          <div className="users-table-card__actions">
            <ButtonRangeDate label="Request Date" onChange={setDateRange} />

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

        <DataTableMT
          dateRange={dateRange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          ticketRows={ticketRows}
          isLoading={isLoadingTickets}
          errorMessage={ticketsError}
          setTicketRows={setTicketRows}
          tableLabel={`${activePage?.title ?? 'MyTickets'} table`}
        />
      </section>

      <DialogCreateTicket
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  )
}

export default MyTickets
