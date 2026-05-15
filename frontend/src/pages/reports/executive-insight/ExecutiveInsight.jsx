import { useEffect, useState } from 'react'
import LineChartMonthly from '../../../components/chart/chart-executive-insight/MonthlyLineChartEI.jsx'
import BarChartEI from '../../../components/chart/chart-executive-insight/BarChartTimeSpendCtr.jsx'
import CardSLASummary from './CardSLASummary.jsx'
import ButtonRangeDate from '../../../components/button/ButtonRangeDate.jsx'
import ButtonExport from '../../../components/button/ButtonExport.jsx'
import { FileText01 } from '../../../components/template/TemplateIcons.jsx'
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

      {/* Filters & Export */}
      <article className="dashboard-panel users-table-card" style={{ marginBottom: '2rem' }}>
        <div className="users-table-card__header">
          <div>
            <h2 className="dashboard-panel__title">Filter & Export</h2>
            <p className="users-table-card__description">
              Sesuaikan periode laporan untuk memperbarui data pada SLA dan Distribusi Kategori.
            </p>
          </div>

          <div className="users-table-card__actions">
            <ButtonRangeDate label="Periode" onChange={handleFilterChange} />
            <ButtonExport variant="action" aria-label="Export executive insight report">
              <FileText01 size={18} aria-hidden="true" />
              <span>Export</span>
            </ButtonExport>
          </div>
        </div>
      </article>

      {/* 3. SLA Summary */}
      <CardSLASummary filters={filters} />

      <div className="chart-grid">
        {/* 4. Tickets by Category */}
        <article className="dashboard-panel chart-card chart-card--wide" style={{ overflow: 'visible' }}>
          <div className="chart-card__header">
            <div className="chart-card__header-copy">
              <p className="dashboard-panel__eyebrow">Category Distribution</p>
              <h2 className="dashboard-panel__title">Tickets by Category</h2>
            </div>
          </div>
          <div className="chart-card__body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <DoughnutChartEiCategory filters={filters} />
          </div>
        </article>
      </div>
    </section>
  )
}
