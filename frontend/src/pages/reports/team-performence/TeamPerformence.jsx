import { useEffect, useMemo, useState } from 'react'

import GroupBarChartTP from '../../../components/chart/chart-team-performence/GroupBarChartMonthlyTP.jsx'
import GroupBarTimeSpendMT from '../../../components/chart/chart-team-performence/GroupBarTimeSpendMT.jsx'
import FilterYear from '../../../components/dropdown/filter/YearPrjPerform.jsx'
import SupportReports from '../../../services/reports/SupportReports.js'
import SupportPerformence from './SupportPerformence.jsx'
import { exportSupportPerformanceDetailsReport } from './supportPerformanceExport.js'

export default function TeamPerformence() {
  const currentYear = String(new Date().getFullYear())
  const [supportFilters, setSupportFilters] = useState({
    startDate: '',
    endDate: '',
  })
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const [monthlyTickets, setMonthlyTickets] = useState({ labels: [], series: [] })
  const [monthlyTimeSpent, setMonthlyTimeSpent] = useState({ labels: [], series: [] })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function fetchMonthlyData() {
      setLoading(true)

      try {
        const year = Number(selectedYear) || new Date().getFullYear()
        const ticketsRes = await SupportReports.getSupportTicketsPerMonth({
          year,
        })

        const timeRes = await SupportReports.getSupportTimeSpentPerMonth({
          year,
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
  }, [selectedYear])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const mappedMembersTickets = useMemo(() => {
    if (!monthlyTickets.series) return []

    const now = new Date()
    const currentMonthIndex = now.getMonth() + 1
    const resolvedYear = Number(selectedYear) || now.getFullYear()
    const visibleMonths =
      resolvedYear === now.getFullYear()
        ? monthlyTickets.labels.filter((month) => month <= currentMonthIndex)
        : monthlyTickets.labels

    return monthlyTickets.series.map((s) => ({
      id: s.support_id,
      name: s.support_name,
      monthlyPerformance: visibleMonths.map((m) => ({
          month: monthNames[m - 1],
          year: resolvedYear,
          monthIndex: m,
          completed: s.data[m - 1] ?? 0,
          pending: 0,
        })),
    }))
  }, [monthlyTickets, selectedYear])

  const mappedMembersTimeSpent = useMemo(() => {
    if (!monthlyTimeSpent.series) return []

    const now = new Date()
    const currentMonthIndex = now.getMonth() + 1
    const resolvedYear = Number(selectedYear) || now.getFullYear()
    const visibleMonths =
      resolvedYear === now.getFullYear()
        ? monthlyTimeSpent.labels.filter((month) => month <= currentMonthIndex)
        : monthlyTimeSpent.labels

    return monthlyTimeSpent.series.map((s) => ({
      id: s.support_id,
      name: s.support_name,
      monthlyPerformance: visibleMonths.map((m) => ({
          month: monthNames[m - 1],
          year: resolvedYear,
          monthIndex: m,
          totalMinutes: s.data_minutes[m - 1] ?? 0,
          totalTimeHuman: null,
          completed: 0,
          pending: 0,
        })),
    }))
  }, [monthlyTimeSpent, selectedYear])

  async function handleExportSupportReport() {
    setExporting(true)

    try {
      await exportSupportPerformanceDetailsReport({
        startDate: supportFilters.startDate,
        endDate: supportFilters.endDate,
        status: 'all',
      })
    } catch (error) {
      console.error('Failed to export support performance report:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="chart-page" aria-label="Team performance report">
      <SupportPerformence
        filters={supportFilters}
        onFiltersChange={setSupportFilters}
        onOpenExport={handleExportSupportReport}
        exporting={exporting}
      />

      <div className="chart-grid">
        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header chart-card__header--split">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Monthly Completed by User</p>
              <h2 className="dashboard-panel__title">Team Monthly Performance</h2>
            </div>
            <FilterYear value={selectedYear} onChange={setSelectedYear} />
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
          <div className="chart-card__header chart-card__header--split">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Monthly Time Spend by User</p>
              <h2 className="dashboard-panel__title">Team Monthly Time Spend</h2>
            </div>
            <FilterYear value={selectedYear} onChange={setSelectedYear} />
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
    </section>
  )
}
