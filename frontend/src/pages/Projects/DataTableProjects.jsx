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
import ButtonHistoryPrj from '../../components/button/ButtonHistoryPrj.jsx'
import DialogProgressPrj from '../../components/dialog/DialogProgressPrj.jsx'
import DialogHoldPrj from '../../components/dialog/DialogHoldPrj.jsx'
import DialogResolvePrj from '../../components/dialog/DialogResolvePrj.jsx'
import DialogHistoryPrj from '../../components/dialog/DialogHistoryPrj.jsx'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

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

// ProjectHistoryPanel removed as it's now in a dialog

function DataTableProjects({
  searchQuery = '',
  tableLabel = 'Projects table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  projectRows = INITIAL_PROJECT_ROWS,
  isLoading = false,
  errorMessage = '',
  onRefresh,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // State for dialogs
  const [selectedProject, setSelectedProject] = useState(null)
  const [isProgressOpen, setIsProgressOpen] = useState(false)
  const [isHoldOpen, setIsHoldOpen] = useState(false)
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleOpenHistory = (project) => {
    setSelectedProject(project)
    setIsHistoryOpen(true)
  }

  const handleOpenProgress = (project) => {
    setSelectedProject(project)
    setIsProgressOpen(true)
  }

  const handleOpenHold = (project) => {
    setSelectedProject(project)
    setIsHoldOpen(true)
  }

  const handleOpenResolve = (project) => {
    setSelectedProject(project)
    setIsResolveOpen(true)
  }

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
          headerActions: (project) => {
            const { rawStatus } = project
            const isWaiting = rawStatus === 'waiting'
            const isHold = rawStatus === 'hold' || rawStatus === 'pending'
            const isInProgress = ['start', 'progress', 'in_progress'].includes(rawStatus)
            const isResolved = rawStatus === 'resolved'
            const isVoid = rawStatus === 'void'

            return (
              <div className="users-table__accordion-actions" style={{ gap: '0.5rem' }}>
                <ButtonHistoryPrj onClick={() => handleOpenHistory(project)}>
                  History
                </ButtonHistoryPrj>
                {!isResolved && !isVoid && (
                  <>
                    {(isWaiting || isHold || isInProgress) && (
                      <ButtonProgressPrj tone="warning" onClick={() => handleOpenProgress(project)}>
                        <PlayArrowIcon fontSize="small" />
                        {isWaiting ? ' Start' : isHold ? ' Continue' : ' Progress'}
                      </ButtonProgressPrj>
                    )}
                    {isInProgress && (
                      <ButtonHoldPrj tone="danger" onClick={() => handleOpenHold(project)}>
                        <PauseIcon fontSize="small" /> Hold
                      </ButtonHoldPrj>
                    )}
                    {isInProgress && (
                      <ButtonResolvePrj tone="default" onClick={() => handleOpenResolve(project)}>
                        <CheckCircleOutlinedIcon fontSize="small" /> Resolve
                      </ButtonResolvePrj>
                    )}
                  </>
                )}
              </div>
            )
          },
          render: (project) => (
            <section className="users-table__detail-section users-table__detail-section--wide">
              <div className="users-table__detail-section-header">
                <p className="users-table__detail-section-eyebrow">Project Detail</p>
              </div>
              <div className="users-table__detail-content" style={{ padding: '0.5rem 0' }}>
                <p style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description || 'Tidak ada deskripsi.'}</p>
              </div>
            </section>
          ),
        }}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />
      <DialogProgressPrj
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        onSuccess={onRefresh}
        project={selectedProject}
      />
      <DialogHoldPrj
        isOpen={isHoldOpen}
        onClose={() => setIsHoldOpen(false)}
        onSuccess={onRefresh}
        project={selectedProject}
      />
      <DialogResolvePrj
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onSuccess={onRefresh}
        project={selectedProject}
      />
      <DialogHistoryPrj
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        project={selectedProject}
      />
    </div>
  )
}

export default DataTableProjects
