import { useEffect, useMemo, useState } from 'react'

import ButtonRangeDate from '../../../components/button/ButtonRangeDate.jsx'
import GroupBarChartTP from '../../../components/chart/chart-team-performence/GroupBarChartMonthlyTP.jsx'
import GroupBarTimeSpendMT from '../../../components/chart/chart-team-performence/GroupBarTimeSpendMT.jsx'
import YearDropdownTP from '../../../components/dropdown/filter/YearTeamPerformance.jsx'
import ButtonExport from '../../../components/button/ButtonExport.jsx'
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
            <ButtonExport variant="action" aria-label="Export team performance report">
              <FileText01 size={18} aria-hidden="true" />
              <span>Export</span>
            </ButtonExport>
          </div>
        </div>
      </article>

      <div className="chart-grid">
        <article className="dashboard-panel chart-card chart-card--wide">
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

        <article className="dashboard-panel chart-card chart-card--wide">
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
    </section>
  )
}
