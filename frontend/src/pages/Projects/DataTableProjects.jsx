import { useEffect, useMemo, useState } from 'react'

import DataTable, {
  DataTableIdentity,
  DataTableStatus,
} from '../../components/table/DataTable.jsx'
import TimeLineMT from '../../components/timeline/TimeLineProject.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  INITIAL_PROJECT_ROWS,
  PAGE_SIZE_OPTIONS,
  getFilteredProjectRows,
  getPaginationItems,
  getProjectEmptyMessage,
  getProjectPageRows,
  getProjectPaginationSummary,
  getStatusVariant,
} from '../../services/projects/DataTableProjects.js'
import { getProjectHistory } from '../../services/projects/Projects.js'
import ButtonHoldPrj from '../../components/button/ButtonHoldPrj.jsx'
import ButtonResolvePrj from '../../components/button/ButtonResolvePrj.jsx'
import ButtonProgressPrj from '../../components/button/ButtonProgressPrj.jsx'

const columns = [
  {
    key: 'projectCode',
    header: 'Project',
    accessor: 'projectCode',
    cellStyle: { whiteSpace: 'nowrap', width: '11%' },
  },
  {
    key: 'projectName',
    header: 'Project',
    accessor: 'projectName',
    cellStyle: { minWidth: '260px' },
  },
  {
    key: 'requestDate',
    header: 'Request Date',
    accessor: 'requestDate',
    cellStyle: { minWidth: '130px' },
  },
  {
    key: 'requestor',
    header: 'Requestor',
    cellStyle: { minWidth: '150px' },
    render: (project) =>
      project.requestor && project.requestor !== '-'
        ? <DataTableIdentity title={project.requestor} />
        : '-',
  },
  {
    key: 'priority',
    header: 'Priority',
    accessor: 'priority',
    cellStyle: { whiteSpace: 'nowrap', width: '9%' },
  },
  {
    key: 'progress',
    header: 'Progress',
    accessor: 'progress',
    cellStyle: { whiteSpace: 'nowrap', width: '9%' },
  },
  {
    key: 'description',
    header: 'Description',
    accessor: 'description',
    cellStyle: { minWidth: '260px' },
  },
  {
    key: 'status',
    header: 'Status',
    cellStyle: { whiteSpace: 'nowrap', width: '10%' },
    render: (project) => (
      <DataTableStatus inline variant={getStatusVariant(project.status)}>
        {project.status}
      </DataTableStatus>
    ),
  },
]

function ProjectHistoryPanel({ project }) {
  const [historyItems, setHistoryItems] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProjectHistory() {
      if (!project?.id) {
        setHistoryItems([])
        setHistoryError('')
        setIsLoadingHistory(false)
        return
      }

      setIsLoadingHistory(true)
      setHistoryError('')

      try {
        const response = await getProjectHistory(project.id)

        if (!isMounted) {
          return
        }

        const sortedData = [...(response.data || [])].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.timestamp || b.created_at || b.createdAt || 0).getTime()
          return dateB - dateA
        })

        setHistoryItems(sortedData)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setHistoryItems([])
        setHistoryError(error?.message || 'Gagal memuat riwayat project.')
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadProjectHistory()

    return () => {
      isMounted = false
    }
  }, [project?.id])

  return (
    <section className="users-table__detail-section users-table__detail-section--wide">
      <div className="users-table__detail-section-header">
        <p className="users-table__detail-section-eyebrow">History</p>
      </div>
      {isLoadingHistory ? (
        <p className="mtickets-timeline__empty">Memuat riwayat project...</p>
      ) : historyError ? (
        <p className="mtickets-timeline__empty">{historyError}</p>
      ) : (
        <TimeLineMT
          items={historyItems}
          emptyMessage="Belum ada riwayat status untuk project ini."
          ariaLabel={`Timeline status ${project.projectCode}`}
        />
      )}
    </section>
  )
}

function DataTableProjects({
  searchQuery = '',
  tableLabel = 'Projects table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  projectRows = INITIAL_PROJECT_ROWS,
  isLoading = false,
  errorMessage = '',
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const filteredRows = useMemo(
    () => getFilteredProjectRows(projectRows, { searchQuery, dateRange, statusFilter }),
    [dateRange, projectRows, searchQuery, statusFilter],
  )
  const { totalPages, safeCurrentPage, rows, firstItem, lastItem } = useMemo(
    () => getProjectPageRows(filteredRows, currentPage, pageSize),
    [currentPage, filteredRows, pageSize],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange.endDate, dateRange.startDate, pageSize, searchQuery, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pagination = {
    summary: getProjectPaginationSummary(firstItem, lastItem, filteredRows.length),
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'Projects pagination',
    pageSizeAriaLabel: 'Jumlah baris project per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }
  const emptyMessage = isLoading
    ? 'Memuat data project...'
    : errorMessage || getProjectEmptyMessage({ searchQuery, dateRange, statusFilter })

  return (
    <div className="mtickets-table-shell">
      <DataTable
        className="mtickets-table"
        rows={rows}
        columns={columns}
        getRowId={(project) => project.id ?? project.projectCode}
        tableLabel={tableLabel}
        detail={{
          columnLabel: 'Actions',
          buttonLabel: 'Detail',
          eyebrow: 'Project',
          title: (project) => [project.projectCode, project.projectName].filter(Boolean).join(' - '),
          description: () => null,
          render: (project) => <ProjectHistoryPanel project={project} />,
        }}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />
    </div>
  )
}

export default DataTableProjects
