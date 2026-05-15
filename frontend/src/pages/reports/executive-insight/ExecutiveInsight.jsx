import { useEffect, useState } from 'react'
import LineChartMonthly from '../../../components/chart/chart-executive-insight/MonthlyLineChartEI.jsx'
import BarChartEI from '../../../components/chart/chart-executive-insight/BarChartTimeSpendCtr.jsx'
import CardSLASummary from './CardSLASummary.jsx'
import ButtonRangeDate from '../../../components/button/ButtonRangeDate.jsx'
import DoughnutChartEiCategory from '../../../components/chart/chart-executive-insight/DoughnutChartEiCategory.jsx'

export default function ExecutiveInsight() {
  const now = new Date()
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [filters, setFilters] = useState({
    startDate: firstDayOfYear,
    endDate: today,
  })

  useEffect(() => {
    document.title = 'Executive Insight - Reports'
  }, [])

  const handleFilterChange = (range) => {
    setFilters(range)
  }

  // Fixed year for top charts (not affected by filters)
  const currentYear = new Date().getFullYear()

  return (
    <section className="chart-page" aria-label="Executive insight report">
      <div className="chart-grid">
        {/* 1. Ticket Tickets per Month */}
        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Monthly Trend ({currentYear})</p>
              <h2 className="dashboard-panel__title">Ticket Tickets per Month</h2>
            </div>
          </div>
          <div className="chart-card__body">
            <LineChartMonthly year={currentYear} />
          </div>
        </article>

        {/* 2. Time Spent per Month by Department */}
        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">SLA Achievement ({currentYear})</p>
              <h2 className="dashboard-panel__title">Time Spent per Month by Department</h2>
            </div>
          </div>
          <div className="chart-card__body">
            <BarChartEI year={currentYear} />
          </div>
        </article>
      </div>

      {/* Executive Summary: Filter and SLA/Category Sections */}
      <article className="dashboard-panel chart-card chart-card--wide" style={{ marginBottom: '2rem', overflow: 'visible' }}>
        <div className="chart-card__header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '2rem' }}>
          <div className="chart-card__header-copy" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h2 className="dashboard-panel__title" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Executive Summary</h2>
            <ButtonRangeDate label="Filter Periode" onChange={handleFilterChange} />
          </div>
        </div>

        <div className="chart-card__body">
          {/* SLA Summary Section - Full Width Horizontal */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="chart-card__header-copy" style={{ marginBottom: '1.25rem' }}>
              <p className="dashboard-panel__eyebrow" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Performance Metrics</p>
              <h3 className="dashboard-panel__title" style={{ fontSize: '1.2rem' }}>SLA Achievement Overview</h3>
            </div>
            <CardSLASummary filters={filters} />
          </div>

          {/* Tickets by Category Section - Below SLA */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
            <div className="chart-card__header-copy" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <p className="dashboard-panel__eyebrow" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Volume Distribution</p>
              <h3 className="dashboard-panel__title" style={{ fontSize: '1.2rem' }}>Tickets by Category</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '380px' }}>
              <div style={{ maxWidth: '600px', width: '100%' }}>
                <DoughnutChartEiCategory filters={filters} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
