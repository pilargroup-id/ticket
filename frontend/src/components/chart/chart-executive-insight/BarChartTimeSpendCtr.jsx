import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import { BarChart } from '@mui/x-charts/BarChart'
import TicketReports from '../../../services/reports/TicketReports.js'

const palette = ['#2a9d8f', '#e9c46a', '#f4a261', '#457b9d', '#e76f51', '#8d99ae']

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Convert minutes to duration object
 */
function getDurationParts(totalMinutes = 0) {
  const normalizedTotalMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0))
  return {
    totalMinutes: normalizedTotalMinutes,
    hours: Math.floor(normalizedTotalMinutes / 60),
    minutes: normalizedTotalMinutes % 60,
    decimalHours: normalizedTotalMinutes / 60,
  }
}

/**
 * Format duration to human readable string
 */
function formatDurationLabel(minutes = 0) {
  const duration = getDurationParts(minutes)
  if (duration.hours === 0) return `${duration.minutes}m`
  return `${duration.hours}h ${duration.minutes}m`
}

function getSeriesDataKey(deptId) {
  return `dept_${String(deptId).replace(/[^a-zA-Z0-9]+/g, '_')}`
}

function buildChartModel(chartData, hiddenKeys, year) {
  if (!chartData || !chartData.series) return { dataset: [], legendItems: [], series: [] }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const hiddenKeySet = new Set(hiddenKeys)
  const normalizedSeries = chartData.series.map((s, index) => ({
    ...s,
    color: palette[index % palette.length],
    dataKey: getSeriesDataKey(s.department_id || s.department_name || index),
  }))

  const labels = (chartData.labels || []).filter((m) => {
    // If selected year is current year, only show up to current month
    if (String(year) === String(currentYear)) {
      return m <= currentMonth
    }
    return true
  })

  const dataset = labels.map((m) => {
    const row = { month: monthNames[m - 1], monthIndex: m }
    normalizedSeries.forEach((s) => {
      const minutes = s.data_minutes[m - 1] ?? 0
      const duration = getDurationParts(minutes)
      row[s.dataKey] = duration.decimalHours // Use decimal hours for chart height
      row[`${s.dataKey}_minutes`] = minutes
    })
    return row
  })

  const legendItems = normalizedSeries.map((s) => {
    // Calculate total only for shown months
    const totalMinutes = labels.reduce((sum, m) => sum + (s.data_minutes[m - 1] ?? 0), 0)
    return {
      dataKey: s.dataKey,
      name: s.department_name,
      color: s.color,
      description: `Total: ${formatDurationLabel(totalMinutes)}`,
      hidden: hiddenKeySet.has(s.dataKey),
    }
  })

  const series = normalizedSeries
    .filter((s) => !hiddenKeySet.has(s.dataKey))
    .map((s) => ({
      dataKey: s.dataKey,
      label: s.department_name,
      color: s.color,
      valueFormatter: (value, context) => {
        const row = typeof context?.dataIndex === 'number' ? dataset[context.dataIndex] : null
        if (row) {
          return formatDurationLabel(row[`${s.dataKey}_minutes`])
        }
        return `${value.toFixed(1)}h`
      },
    }))

  return {
    dataset,
    legendItems,
    series,
  }
}

export default function BarChartTimeSpendCtr({ year = new Date().getFullYear() }) {
  const [chartData, setChartData] = useState({ labels: [], series: [] })
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await TicketReports.getTimeSpentPerMonthDepartment({ year })
        setChartData(res.chart)
      } catch (error) {
        console.error('Failed to fetch department time spent data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [year])

  const { dataset, legendItems, series } = useMemo(
    () => buildChartModel(chartData, hiddenSeriesKeys, year),
    [chartData, hiddenSeriesKeys, year],
  )

  const handleToggleSeries = (dataKey) => {
    setHiddenSeriesKeys((currentKeys) => {
      if (currentKeys.includes(dataKey)) {
        return currentKeys.filter((currentKey) => currentKey !== dataKey)
      }
      return [...currentKeys, dataKey]
    })
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="users-table-card__description">Loading data...</p>
      </Box>
    )
  }

  if (chartData.series.length === 0) {
    return (
      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="users-table-card__description">Belum ada data time spent untuk tahun {year}.</p>
      </Box>
    )
  }

  return (
    <div className="team-performance-chart">
      {series.length > 0 ? (
        <>
          <div className="team-performance-chart__legend" aria-label="Department time spent legend" style={{ marginBottom: '1.5rem' }}>
            {legendItems.map((item) => (
              <button
                key={item.dataKey}
                type="button"
                className={[
                  'team-performance-chart__legend-item',
                  item.hidden ? 'team-performance-chart__legend-item--hidden' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={!item.hidden}
                onClick={() => handleToggleSeries(item.dataKey)}
              >
                <span
                  className="team-performance-chart__legend-swatch"
                  aria-hidden="true"
                  style={{ backgroundColor: item.color }}
                />
                <span className="team-performance-chart__legend-label">{item.name}</span>
                <span className="team-performance-chart__legend-tooltip">{item.description}</span>
              </button>
            ))}
          </div>

          <Box sx={{ width: '100%', height: 400 }}>
            <BarChart
              dataset={dataset}
              series={series}
              xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
              yAxis={[{ 
                width: 42,
                label: 'Hours',
              }]}
              grid={{ horizontal: true }}
              axisHighlight={{ x: 'band' }}
              borderRadius={6}
              hideLegend
              margin={{ top: 24, right: 30, bottom: 34, left: 50 }}
              slotProps={{
                tooltip: {
                  trigger: 'axis',
                  popperOptions: {
                    modifiers: [
                      {
                        name: 'flip',
                        enabled: true,
                        options: {
                          fallbackPlacements: ['top-start', 'top-end', 'bottom'],
                        },
                      },
                      {
                        name: 'preventOverflow',
                        enabled: true,
                        options: {
                          padding: 10,
                        },
                      },
                    ],
                  },
                },
              }}
            />
          </Box>
        </>
      ) : (
        <div className="team-performance-chart__empty">
          Semua departemen sedang di-disable. Klik salah satu departemen untuk menampilkan chart kembali.
        </div>
      )}
    </div>
  )
}
