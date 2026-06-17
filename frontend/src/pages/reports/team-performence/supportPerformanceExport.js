import SupportReports from '../../../services/reports/SupportReports.js'

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
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportSupportPerformanceDetailsReport(filters = {}) {
  const startDate = filters.startDate || ''
  const endDate = filters.endDate || ''
  const status = filters.status || 'all'

  const summaryResponse = await SupportReports.getSupportSummary({
    startDate,
    endDate,
    status,
  })

  const supports = Array.isArray(summaryResponse.data) ? summaryResponse.data : []
  const supportDetails = await Promise.all(
    supports.map(async (support) => {
      const detailResponse = await SupportReports.getSupportTicketsDetail(support.support_id, {
        startDate,
        endDate,
        status,
      })

      return {
        support,
        details: Array.isArray(detailResponse.data) ? detailResponse.data : [],
      }
    }),
  )

  const csvLines = [
    buildCsvRow(['Support Team Performance Detail']),
    buildCsvRow(['Start Date', startDate || 'All']),
    buildCsvRow(['End Date', endDate || 'All']),
    buildCsvRow(['Status', status]),
    buildCsvRow(['Total Support', supports.length]),
  ]

  if (!supportDetails.length) {
    csvLines.push('')
    csvLines.push(buildCsvRow(['Belum ada data support untuk periode ini.']))
  }

  supportDetails.forEach(({ support, details }) => {
    const averageMinutes =
      Number(support.total_tickets) > 0
        ? Math.round((Number(support.total_minutes) || 0) / Number(support.total_tickets))
        : 0

    csvLines.push('')
    csvLines.push(buildCsvRow([`Support: ${support.support_name}`]))
    csvLines.push(buildCsvRow(['Support ID', support.support_id]))
    csvLines.push(
      buildCsvRow([
        'Total Tickets',
        support.total_tickets ?? 0,
        'Resolved Tickets',
        support.resolved_tickets ?? 0,
        'Open Tickets',
        support.open_tickets ?? 0,
      ]),
    )
    csvLines.push(
      buildCsvRow([
        'Late Tickets',
        support.late_tickets ?? 0,
        'Total Minutes',
        support.total_minutes ?? 0,
        'Total Time',
        formatMinutesToHuman(support.total_minutes),
      ]),
    )
    csvLines.push(buildCsvRow(['Average Minutes per Ticket', averageMinutes]))
    csvLines.push(
      buildCsvRow([
        'Code',
        'User',
        'Category',
        'Status',
        'Time (Minutes)',
        'Problem',
        'Solution',
        'Late',
        'Created',
      ]),
    )

    if (!details.length) {
      csvLines.push(buildCsvRow(['No detail data', '', '', '', '', '', '', '', '']))
      return
    }

    details.forEach((detail) => {
      csvLines.push(
        buildCsvRow([
          detail.ticket_code,
          detail.user_name,
          detail.category_name,
          detail.status,
          detail.time_spent ?? 0,
          detail.problem,
          detail.solution,
          detail.is_late ? 'Late' : 'On Time',
          detail.created_at,
        ]),
      )
    })
  })

  downloadCsvFile(
    csvLines.join('\n'),
    `support-team-performance-${formatDateForFileName(startDate)}-${formatDateForFileName(endDate)}.csv`,
  )
}

