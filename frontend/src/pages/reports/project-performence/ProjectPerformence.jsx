import React, { useEffect, useState, useMemo } from 'react'
import DataTableAction, { DataTableIdentity } from './DataTablePrjPerform.jsx'
import ButtonRangeDate from '../../../components/button/ButtonRangeDate.jsx'
import { EMPTY_DATE_RANGE, getTicketPageRows, getPaginationItems, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '../../../services/my-tickets/DataTableMT.js'
import { getDeveloperProjectSummary } from '../../../services/reports/DeveloperReports.js'
import FilterStatus from '../../../components/dropdown/filter/HeaderStatusPrjPerform.jsx'
import FilterYear from '../../../components/dropdown/filter/YearPrjPerform.jsx'
import ExportPrjPerform from './ExportPrjPerform.jsx'
import DialogTimelinePrjPerf from '../../../components/dialog/DialogTimelinePrjPerf.jsx'

const columns = [
  {
    key: 'developer',
    header: 'Developer',
    cellStyle: { minWidth: '200px' },
    render: (row) => (
      <DataTableIdentity title={row.developer_name} subtitle={`ID: ${row.developer_id}`} />
    ),
  },
  {
    key: 'projects_count',
    header: 'Projects',
    accessor: 'projects_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'total_tasks',
    header: 'Total Tasks',
    accessor: 'total_tasks',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'avg_progress_task',
    header: 'Avg. Progress',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '12%' },
    render: (row) => `${row.avg_progress_task}%`,
  },
  {
    key: 'open_touch_count',
    header: 'Open Touch',
    accessor: 'open_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'resolved_touch_count',
    header: 'Resolved Touch',
    accessor: 'resolved_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'late_touch_count',
    header: 'Late Touch',
    accessor: 'late_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
]

const ProjectPerformence = () => {
  const [rows, setRows] = useState([])
  const [selectedRange, setSelectedRange] = useState(EMPTY_DATE_RANGE)
  const [year, setYear] = useState('2026')
  const [status, setStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedDeveloper, setSelectedDeveloper] = useState(null)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await getDeveloperProjectSummary({
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
          year: year,
          status: status,
        })
        setRows(response.data)
      } catch (error) {
        console.error('Failed to fetch developer project summary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedRange, status, year])

  const handleDetailClick = (row) => {
    setSelectedDeveloper(row)
    setIsTimelineOpen(true)
  }

  const { totalPages, safeCurrentPage, rows: pageRows, firstItem, lastItem } = useMemo(
    () => getTicketPageRows(rows, currentPage, pageSize),
    [currentPage, rows, pageSize],
  )

  const pagination = {
    summary: `${firstItem}-${lastItem} dari ${rows.length} developer`,
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'Developer summary pagination',
    pageSizeAriaLabel: 'Jumlah baris per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }

  const actions = [
    {
      key: 'detail',
      label: 'Detail',
      onClick: handleDetailClick,
    },
  ]

  return (
    <div className="chart-page">
      {/* Data Table Card */}
      <article className="dashboard-panel users-table-card">
        <div className="users-table-card__header" style={{ 
          paddingBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 className="dashboard-panel__title" style={{ fontSize: '1.25rem' }}>Performance Data</h2>
            <p className="users-table-card__description">
              Data pengerjaan ticket berdasarkan filter yang dipilih.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            flex: '1 1 auto'
          }}>
            <FilterYear value={year} onChange={setYear} />
            <FilterStatus value={status} onChange={setStatus} />
            <ButtonRangeDate label="Periode" onChange={setSelectedRange} />
            <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }}></div>
            <ExportPrjPerform />
          </div>
        </div>

        <div className="dashboard-panel__body" style={{ marginTop: '0.5rem' }}>
          <DataTableAction
            rows={pageRows}
            columns={columns}
            actions={actions}
            getRowId={(row) => row.developer_id}
            tableLabel="Project Performance Table"
            emptyMessage={isLoading ? 'Memuat data...' : 'Belum ada data untuk ditampilkan.'}
            pagination={pagination}
          />
        </div>
      </article>

      <DialogTimelinePrjPerf
        isOpen={isTimelineOpen}
        developerId={selectedDeveloper?.developer_id}
        year={year}
        status={status}
        eyebrow="Developer Performance"
        title={`Timeline ${selectedDeveloper?.developer_name || ''}`}
        onClose={() => setIsTimelineOpen(false)}
      />
    </div>
  )
}

export default ProjectPerformence
