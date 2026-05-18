import { useEffect, useMemo, useState } from 'react'
import { getCache, setCache } from '../../services/cache.js'
import SkeletonLoading from '../../components/template/SkeletonLoading.jsx'

import ButtonRangeDate from '../../components/button/ButtonRangeDate.jsx'
import { Ticket01, ChevronDown } from '../../components/template/TemplateIcons.jsx'
import { INITIAL_TICKET_ROWS } from '../../services/my-tickets/DataTableMT.js'
import { getMyTickets } from '../../services/my-tickets/MyTickets.js'
import CardStatusMT from './CardStatusMT.jsx'
import DataTableMT from './DataTableMT.jsx'
import DialogCreateTicket from '../../components/dialog/DialogCreateMT.jsx'
import DialogValidationAddFB from '../../components/dialog/DialogValidationAddFB.jsx'
import MobilePillStatus from './MobilePillStatus.jsx'
import ButtonMobileMT from '../../components/button/ButtonMobileMT.jsx'

function MyTickets({ activePage, searchQuery, onLoadingChange }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [ticketRows, setTicketRows] = useState(() => getCache('my-tickets') || INITIAL_TICKET_ROWS)
  const [isLoadingTickets, setIsLoadingTickets] = useState(!getCache('my-tickets'))
  const [ticketsError, setTicketsError] = useState('')
  const [ticketRefreshVersion, setTicketRefreshVersion] = useState(0)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        setCache('my-tickets', response.data)
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
  }, [ticketRefreshVersion])

  const statusCounts = useMemo(
    () =>
      ticketRows.reduce((counts, ticket) => {
        counts[ticket.status] = (counts[ticket.status] ?? 0) + 1
        return counts
      }, {}),
    [ticketRows],
  )

  const handleTicketCreated = () => {
    setTicketRefreshVersion((currentVersion) => currentVersion + 1)
  }

  const isPageLoading = isLoadingTickets && ticketRows.length === 0 && !ticketsError

  useEffect(() => {
    onLoadingChange?.(isPageLoading)

    return () => {
      onLoadingChange?.(false)
    }
  }, [isPageLoading, onLoadingChange])

  if (isPageLoading) {
    return <SkeletonLoading pageType="/MyTickets" />
  }

  return (
    <>
      {!isMobile && (
        <CardStatusMT
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          statusCounts={statusCounts}
        />
      )}

      <section
        className="dashboard-panel users-table-card mytickets-table-card"
        aria-label="Aktivitas legal"
        style={isMobile ? { backgroundColor: 'transparent', boxShadow: 'none', padding: '0', border: 'none' } : {}}
      >
        <div className="users-table-card__header mytickets-table-card__header" style={isMobile ? { padding: '0', marginTop: '0', marginBottom: '2px', borderBottom: 'none', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } : {}}>
          <div className="mytickets-table-card__title-group" style={isMobile ? { display: 'flex', alignItems: 'center' } : {}}>
            <h1 className="dashboard-panel__title mytickets-table-card__title" style={isMobile ? { fontSize: '20px', color: '#0f172a', fontWeight: 700, margin: 0 } : {}}>
              {activePage?.title ?? 'My Tickets'}
            </h1>
          </div>
          {isMobile && (
            <ButtonMobileMT 
              onClickCreate={() => {
                const hasPendingFeedback = ticketRows.some((ticket) => ticket.status === 'Resolved')
                if (hasPendingFeedback) {
                  setIsValidationDialogOpen(true)
                } else {
                  setIsCreateDialogOpen(true)
                }
              }} 
            />
          )}

          {!isMobile && (
            <div className="users-table-card__actions">
              <ButtonRangeDate label="Request Date" onChange={setDateRange} />
              <button
                type="button"
                className="users-table-card__action"
                onClick={() => {
                  const hasPendingFeedback = ticketRows.some((ticket) => ticket.status === 'Resolved')
                  if (hasPendingFeedback) {
                    setIsValidationDialogOpen(true)
                  } else {
                    setIsCreateDialogOpen(true)
                  }
                }}
                aria-haspopup="dialog"
                aria-expanded={isCreateDialogOpen || isValidationDialogOpen}
              >
                <Ticket01 size={18} aria-hidden="true" />
                <span>Create Tickets</span>
              </button>
            </div>
          )}
        </div>

        {isMobile && (
          <MobilePillStatus
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            statusCounts={statusCounts}
            style={{ padding: '6px 16px 8px' }}
          />
        )}

        <DataTableMT
          dateRange={dateRange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          ticketRows={ticketRows}
          isLoading={isLoadingTickets}
          errorMessage={ticketsError}
          refreshVersion={ticketRefreshVersion}
          setTicketRows={setTicketRows}
          refreshData={() => setTicketRefreshVersion((v) => v + 1)}
          tableLabel={`${activePage?.title ?? 'MyTickets'} table`}
        />
      </section>

      <DialogCreateTicket
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={handleTicketCreated}
      />

      <DialogValidationAddFB
        isOpen={isValidationDialogOpen}
        onClose={() => setIsValidationDialogOpen(false)}
      />
    </>
  )
}

export default MyTickets
