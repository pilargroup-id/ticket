import SupportReports from '../../../services/reports/SupportReports.js'

function formatDateForFileName(value) {
  if (!value) {
    return 'all'
  }

  return String(value).replace(/[^0-9]/g, '') || 'all'
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
  const resolvedStartDate = summaryResponse.meta?.start_date || startDate
  const resolvedEndDate = summaryResponse.meta?.end_date || endDate

  const supports = Array.isArray(summaryResponse.data) ? summaryResponse.data : []
  const supportDetails = await Promise.all(
    supports.map(async (support) => {
      const detailResponse = await SupportReports.getAllSupportTicketsDetail(
        support.support_id,
        {
          startDate: resolvedStartDate,
          endDate: resolvedEndDate,
          status,
          expectedTotal: support.total_tickets,
        },
      )

      return {
        support,
        details: Array.isArray(detailResponse.data) ? detailResponse.data : [],
      }
    }),
  )

  const flattenedDetails = supportDetails.flatMap(({ support, details }) =>
    details.map((detail) => ({
      ...detail,
      support_name: detail.support_name || support.support_name || '-',
    })),
  )

  const csvLines = [
    buildCsvRow(['Support Team Performance Detail']),
    buildCsvRow(['Start Date', resolvedStartDate || 'All']),
    buildCsvRow(['End Date', resolvedEndDate || 'All']),
    buildCsvRow(['Status', status]),
    buildCsvRow(['Total Support', supports.length]),
  ]

  if (!flattenedDetails.length) {
    csvLines.push('')
    csvLines.push(buildCsvRow(['Belum ada data support untuk periode ini.']))
  } else {
    csvLines.push('')
    csvLines.push(
      buildCsvRow([
        'Code',
        'Support',
        'User',
        'Category',
        'Status',
        'Problem',
        'Solution',
        'Late',
        'Created',
        'Tanggal dan jam mulai dikerjakan oleh support',
        'Tanggal dan jam selesai dikerjakan oleh support',
        'Time (Minutes)',
      ]),
    )

    flattenedDetails.forEach((detail) => {
      csvLines.push(
        buildCsvRow([
          detail.ticket_code,
          detail.support_name,
          detail.user_name,
          detail.category_name,
          detail.status,
          detail.problem,
          detail.solution,
          detail.is_late ? 'Late' : 'On Time',
          detail.created_at,
          detail.start_date,
          detail.end_date,
          detail.time_spent ?? 0,
        ]),
      )
    })
  }

  downloadCsvFile(
    csvLines.join('\n'),
    `support-team-performance-${formatDateForFileName(resolvedStartDate)}-${formatDateForFileName(resolvedEndDate)}.csv`,
  )
}
