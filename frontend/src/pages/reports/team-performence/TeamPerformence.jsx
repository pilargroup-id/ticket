import { useEffect, useMemo, useState } from 'react'

import ButtonRangeDate from '../../../components/button/ButtonRangeDate.jsx'
import GroupBarChartTP from '../../../components/chart/chart-team-performence/GroupBarChartMonthlyTP.jsx'
import GroupBarTimeSpendMT from '../../../components/chart/chart-team-performence/GroupBarTimeSpendMT.jsx'
import YearDropdownTP from '../../../components/dropdown/filter/YearTeamPerformance.jsx'
import ButtonExport from '../../../components/button/ButtonExport.jsx'
import DialogSelectedExport from '../../../components/dialog/DialogSelectedExport.jsx'
import { FileText01 } from '../../../components/template/TemplateIcons.jsx'
import SupportReports from '../../../services/reports/SupportReports.js'
import SupportPerformence from './SupportPerformence.jsx'

// Removed dummy teamMembers data

function parseDateValue(value) {
  const [year, month, day] = String(value).split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function getRangeKey(date) {
  return date.getFullYear() * 100 + date.getMonth() + 1
}

function filterMonthlyPerformance(monthlyPerformance, range) {
  const startDate = parseDateValue(range.startDate)
  const endDate = parseDateValue(range.endDate)

  if (!startDate || !endDate) {
    return monthlyPerformance
  }

  const startKey = getRangeKey(startDate)
  const endKey = getRangeKey(endDate)

  return monthlyPerformance.filter((item) => {
    const itemKey = item.year * 100 + item.monthIndex

    return itemKey >= startKey && itemKey <= endKey
  })
}

function getPerformanceTotals(monthlyPerformance) {
  return monthlyPerformance.reduce(
    (totals, item) => ({
      completed: totals.completed + item.completed,
      pending: totals.pending + item.pending,
    }),
    { completed: 0, pending: 0 },
  )
}

function getAvailableYears(members) {
  const years = new Set()

  members.forEach((member) => {
    member.monthlyPerformance.forEach((item) => {
      if (item.year) {
        years.add(item.year)
      }
    })
  })

  return Array.from(years).sort((leftYear, rightYear) => rightYear - leftYear)
}

function filterMembersByYear(members, selectedYear) {
  return members
    .map((member) => ({
      ...member,
      monthlyPerformance: member.monthlyPerformance.filter(
        (item) => String(item.year) === String(selectedYear),
      ),
    }))
    .filter((member) => member.monthlyPerformance.length > 0)
}

function formatRangeLabel(range) {
  const startDate = parseDateValue(range.startDate)
  const endDate = parseDateValue(range.endDate)

  if (!startDate || !endDate) {
    return 'Jan - May 2026'
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

function formatDateForFileName(value) {
  if (!value) {
    return 'all'
  }

  return String(value).replace(/[^0-9]/g, '') || 'all'
}

function formatMinutesToHuman(minutes) {
  const totalMinutes = Number(minutes) || 0
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}j ${remainingMinutes}m`
  }

  return `${remainingMinutes}m`
}

function getMonthLabel(monthNumber) {
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
    new Date(2026, Number(monthNumber) - 1, 1),
  )
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function buildCsvRow(values) {
  return values.map(escapeCsvValue).join(',')
}

function downloadCsvFile(content, fileName) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  downloadBlobFile(blob, fileName)
}

function downloadBlobFile(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const EXPORT_OPTIONS = [
  {
    value: 'monthly-performance',
    label: 'Team Monthly Performance',
    description: 'Export data completed tickets per bulan untuk setiap agent.',
  },
  {
    value: 'monthly-time-spend',
    label: 'Team Monthly Time Spend',
    description: 'Export data total durasi pengerjaan per bulan untuk setiap agent.',
  },
  {
    value: 'support-performance',
    label: 'Support Team Performance',
    description: 'Export summary support team beserta detail tiket tiap agent.',
  },
]

export default function TeamPerformence() {
  const currentYear = String(new Date().getFullYear())
  const [selectedRange, setSelectedRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Removed unused useMemo logic for dummy data
  const activeRangeLabel = useMemo(() => formatRangeLabel(selectedRange), [selectedRange])

  const [monthlyTickets, setMonthlyTickets] = useState({ labels: [], series: [] })
  const [monthlyTimeSpent, setMonthlyTimeSpent] = useState({ labels: [], series: [] })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedExportSections, setSelectedExportSections] = useState(
    EXPORT_OPTIONS.map((option) => option.value),
  )

  useEffect(() => {
    async function fetchMonthlyData() {
      setLoading(true)
      try {
        const year = new Date().getFullYear()
        
        // Fetch tickets per month
        const ticketsRes = await SupportReports.getSupportTicketsPerMonth({
          year,
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
        })
        
        // Fetch time spent per month
        const timeRes = await SupportReports.getSupportTimeSpentPerMonth({
          year,
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
        })

        setMonthlyTickets(ticketsRes.chart)
        setMonthlyTimeSpent(timeRes.chart)
      } catch (error) {
        console.error('Failed to fetch monthly report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyData()
  }, [selectedRange])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const mappedMembersTickets = useMemo(() => {
    if (!monthlyTickets.series) return []

    // Determine current month index (1-based)
    const now = new Date()
    const currentMonthIndex = now.getMonth() + 1
    const year = now.getFullYear()

    return monthlyTickets.series.map((s) => ({
      id: s.support_id,
      name: s.support_name,
      monthlyPerformance: monthlyTickets.labels
        .filter((m) => m <= currentMonthIndex) // Only show up to current month
        .map((m) => ({
          month: monthNames[m - 1],
          year: year,
          monthIndex: m,
          completed: s.data[m - 1] ?? 0,
          pending: 0,
        })),
    }))
  }, [monthlyTickets])

  const mappedMembersTimeSpent = useMemo(() => {
    if (!monthlyTimeSpent.series) return []

    const now = new Date()
    const currentMonthIndex = now.getMonth() + 1
    const year = now.getFullYear()

    return monthlyTimeSpent.series.map((s) => ({
      id: s.support_id,
      name: s.support_name,
      monthlyPerformance: monthlyTimeSpent.labels
        .filter((m) => m <= currentMonthIndex) // Only show up to current month
        .map((m) => ({
          month: monthNames[m - 1],
          year: year,
          monthIndex: m,
          totalMinutes: s.data_minutes[m - 1] ?? 0,
          totalTimeHuman: null, // Component will calculate if null, or we can leave it
          completed: 0,
          pending: 0,
        })),
    }))
  }, [monthlyTimeSpent])

  function handleOpenExportDialog() {
    setIsExportDialogOpen(true)
  }

  function handleCloseExportDialog() {
    if (exporting) {
      return
    }

    setIsExportDialogOpen(false)
  }

  function handleToggleExportSection(value) {
    setSelectedExportSections((currentSections) =>
      currentSections.includes(value)
        ? currentSections.filter((section) => section !== value)
        : [...currentSections, value],
    )
  }

  function handleToggleAllExportSections() {
    setSelectedExportSections((currentSections) =>
      currentSections.length === EXPORT_OPTIONS.length
        ? []
        : EXPORT_OPTIONS.map((option) => option.value),
    )
  }

  async function handleExportReport() {
    setExporting(true)

    try {
      const needsMonthlyPerformance = selectedExportSections.includes('monthly-performance')
      const needsMonthlyTimeSpend = selectedExportSections.includes('monthly-time-spend')
      const needsSupportPerformance = selectedExportSections.includes('support-performance')
      const needsCsvExport = needsMonthlyPerformance || needsMonthlyTimeSpend

      const year = new Date().getFullYear()
      let ticketsRes = null
      let timeRes = null

      if (needsCsvExport) {
        ;[ticketsRes, timeRes] = await Promise.all([
          needsMonthlyPerformance
            ? SupportReports.getSupportTicketsPerMonth({
                year,
                startDate: selectedRange.startDate,
                endDate: selectedRange.endDate,
              })
            : Promise.resolve(null),
          needsMonthlyTimeSpend
            ? SupportReports.getSupportTimeSpentPerMonth({
                year,
                startDate: selectedRange.startDate,
                endDate: selectedRange.endDate,
              })
            : Promise.resolve(null),
        ])
      }

      const csvLines = [
        buildCsvRow(['Team Performance Report']),
        buildCsvRow(['Period', activeRangeLabel]),
        buildCsvRow(['Start Date', selectedRange.startDate || 'All']),
        buildCsvRow(['End Date', selectedRange.endDate || 'All']),
      ]

      if (selectedExportSections.includes('monthly-performance')) {
        csvLines.push('')
        csvLines.push(buildCsvRow(['Monthly Completed Tickets']))
        csvLines.push(buildCsvRow(['Month', 'Support ID', 'Support Name', 'Completed Tickets']))

        if (ticketsRes?.chart?.series?.length) {
          ticketsRes.chart.series.forEach((series) => {
            ticketsRes.chart.labels.forEach((monthNumber) => {
              csvLines.push(
                buildCsvRow([
                  getMonthLabel(monthNumber),
                  series.support_id,
                  series.support_name,
                  series.data?.[monthNumber - 1] ?? 0,
                ]),
              )
            })
          })
        } else {
          csvLines.push(buildCsvRow(['No data', '', '', '']))
        }
      }

      if (selectedExportSections.includes('monthly-time-spend')) {
        csvLines.push('')
        csvLines.push(buildCsvRow(['Monthly Time Spent']))
        csvLines.push(
          buildCsvRow(['Month', 'Support ID', 'Support Name', 'Total Minutes', 'Human Readable']),
        )

        if (timeRes?.chart?.series?.length) {
          timeRes.chart.series.forEach((series) => {
            timeRes.chart.labels.forEach((monthNumber) => {
              const totalMinutes = series.data_minutes?.[monthNumber - 1] ?? 0

              csvLines.push(
                buildCsvRow([
                  getMonthLabel(monthNumber),
                  series.support_id,
                  series.support_name,
                  totalMinutes,
                  formatMinutesToHuman(totalMinutes),
                ]),
              )
            })
          })
        } else {
          csvLines.push(buildCsvRow(['No data', '', '', '', '']))
        }
      }

      if (needsCsvExport) {
        downloadCsvFile(
          csvLines.join('\n'),
          `team-performance-${formatDateForFileName(selectedRange.startDate)}-${formatDateForFileName(selectedRange.endDate)}.csv`,
        )
      }

      if (needsSupportPerformance) {
        const exportedFile = await SupportReports.exportSupportTickets({
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
          status: 'all',
        })

        downloadBlobFile(exportedFile.blob, exportedFile.fileName)
      }

      setIsExportDialogOpen(false)
    } catch (error) {
      console.error('Failed to export team performance report:', error)
    } finally {
      setExporting(false)
    }
  }

  // Removed unused useEffect for yearOptions

  return (
    <section className="chart-page" aria-label="Team performance report">
      <article className="dashboard-panel users-table-card">
        <div className="users-table-card__header">
          <div>
            <p className="dashboard-panel__eyebrow">Reports</p>
            <h1 className="dashboard-panel__title">Team Performance</h1>
            <p className="users-table-card__description">
              Monitoring performa bulanan setiap user berdasarkan jumlah tiket completed dan
              pending pada periode {activeRangeLabel}.
            </p>
          </div>

          <div className="users-table-card__actions">
            <ButtonRangeDate label="Periode" onChange={setSelectedRange} />
            <ButtonExport
              variant="action"
              aria-label="Export team performance report"
              onClick={handleOpenExportDialog}
              disabled={exporting}
            >
              <FileText01 size={18} aria-hidden="true" />
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </ButtonExport>
          </div>
        </div>
      </article>

      <div className="chart-grid">
        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header chart-card__header--split">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Monthly Completed by User</p>
              <h2 className="dashboard-panel__title">Team Monthly Performance</h2>
            </div>

              {/* Removed YearDropdownTP as it is not needed for the summary view */}
          </div>

          <div className="chart-card__body">
            {!loading && mappedMembersTickets.length > 0 ? (
              <GroupBarChartTP
                members={mappedMembersTickets}
                emptyMessage={`Belum ada data monthly performance untuk tahun ${selectedYear}.`}
              />
            ) : loading ? (
              <p className="users-table-card__description">Loading data...</p>
            ) : (
              <p className="users-table-card__description">
                Belum ada data pada rentang tanggal ini.
              </p>
            )}
          </div>
        </article>

        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Monthly Time Spend by User</p>
              <h2 className="dashboard-panel__title">Team Monthly Time Spend</h2>
            </div>
          </div>

          <div className="chart-card__body">
            {!loading && mappedMembersTimeSpent.length > 0 ? (
              <GroupBarTimeSpendMT
                members={mappedMembersTimeSpent}
                emptyMessage={`Belum ada data monthly time spend untuk tahun ${selectedYear}.`}
              />
            ) : loading ? (
              <p className="users-table-card__description">Loading data...</p>
            ) : (
              <p className="users-table-card__description">
                Belum ada data pada rentang tanggal ini.
              </p>
            )}
          </div>
        </article>
      </div>
      <SupportPerformence filters={selectedRange} />
      <DialogSelectedExport
        isOpen={isExportDialogOpen}
        onClose={handleCloseExportDialog}
        onConfirm={handleExportReport}
        exporting={exporting}
        options={EXPORT_OPTIONS}
        selectedValues={selectedExportSections}
        onToggleValue={handleToggleExportSection}
        onToggleAll={handleToggleAllExportSections}
      />
    </section>
  )
}
