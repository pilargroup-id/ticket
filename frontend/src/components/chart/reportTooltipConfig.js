const reportTooltipModifiers = [
  {
    name: 'offset',
    options: {
      offset: [0, 4],
    },
  },
  {
    name: 'flip',
    enabled: true,
    options: {
      fallbackPlacements: ['right-start', 'left-start', 'top-start', 'bottom-end'],
    },
  },
  {
    name: 'preventOverflow',
    enabled: true,
    options: {
      altAxis: true,
      rootBoundary: 'viewport',
      padding: 12,
    },
  },
]

function buildReportTooltipProps(trigger) {
  return {
    trigger,
    anchor: 'pointer',
    placement: 'bottom-start',
    popperOptions: {
      modifiers: reportTooltipModifiers,
    },
  }
}

export const reportAxisTooltipProps = buildReportTooltipProps('axis')
export const reportItemTooltipProps = buildReportTooltipProps('item')
