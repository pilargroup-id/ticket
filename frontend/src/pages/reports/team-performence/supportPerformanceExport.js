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

  const flattenedDetails = supportDetails.flatMap(({ support, details }) =>
    details.map((detail) => ({
      ...detail,
      support_name: detail.support_name || support.support_name || '-',
    })),
  )

  const csvLines = [
    buildCsvRow(['Support Team Performance Detail']),
    buildCsvRow(['Start Date', startDate || 'All']),
    buildCsvRow(['End Date', endDate || 'All']),
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
        'Time (Minutes)',
        'Problem',
        'Solution',
        'Late',
        'Created',
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
          detail.time_spent ?? 0,
          detail.problem,
          detail.solution,
          detail.is_late ? 'Late' : 'On Time',
          detail.created_at,
        ]),
      )
    })
  }

  downloadCsvFile(
    csvLines.join('\n'),
    `support-team-performance-${formatDateForFileName(startDate)}-${formatDateForFileName(endDate)}.csv`,
  )
}
