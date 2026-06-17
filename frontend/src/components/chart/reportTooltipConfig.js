const reportTooltipModifiers = [
  {
    name: 'offset',
    options: {
      offset: [0, 2],
    },
  },
  {
    name: 'flip',
    enabled: true,
    options: {
      fallbackPlacements: [
        'right-start',
        'left-start',
        'top-start',
        'top-end',
        'bottom-end',
      ],
    },
  },
  {
    name: 'preventOverflow',
    enabled: true,
    options: {
      altAxis: true,
      tether: true,
      rootBoundary: 'viewport',
      padding: 8,
    },
  },
]

function buildReportTooltipProps(trigger) {
  return {
    trigger,
    anchor: 'pointer',
    placement: 'bottom-start',
    popperOptions: {
      strategy: 'fixed',
      modifiers: reportTooltipModifiers,
    },
  }
}

export const reportAxisTooltipProps = buildReportTooltipProps('axis')
export const reportItemTooltipProps = buildReportTooltipProps('item')
