import { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import { PieChart } from '@mui/x-charts/PieChart';
import TicketReports from '../../../services/reports/TicketReports.js';
import { reportItemTooltipProps } from '../reportTooltipConfig.js'

const palette = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function DoughnutChartEiCategory({ filters = {} }) {
  const [data, setData] = useState([]);
  const [hiddenLabels, setHiddenLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!filters.startDate || !filters.endDate) return;

      setLoading(true);
      try {
        const res = await TicketReports.getTicketsDistributionCategory(filters);
        // Expecting data in format: [{ label: 'Category A', value: 10 }, ...]
        const formattedData = (res.data || []).map((item, index) => ({
          ...item,
          // API returns category object with name, fallback to other common fields
          label: item.category?.name || item.category_name || item.label || `Category ${index + 1}`,
          value: Number(item.count || item.value || 0),
          id: item.category_id || item.id || `cat-${index}`,
          color: palette[index % palette.length],
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Failed to fetch category distribution data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  const handleToggleLabel = (label) => {
    setHiddenLabels((current) =>
      current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label]
    );
  };

  const visibleData = useMemo(() => {
    return data.filter((item) => !hiddenLabels.includes(item.label));
  }, [data, hiddenLabels]);

  const legendItems = useMemo(() => {
    return data.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      color: item.color,
      hidden: hiddenLabels.includes(item.label),
    }));
  }, [data, hiddenLabels]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="users-table-card__description">Loading data...</p>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="users-table-card__description">Belum ada data distribusi kategori untuk periode ini.</p>
      </Box>
    );
  }

  return (
    <div className="team-performance-chart" style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
      <div 
        className="team-performance-chart__legend" 
        aria-label="Category distribution legend" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem', 
          minWidth: '220px',
          flex: '0 0 auto'
        }}
      >
        {legendItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              'team-performance-chart__legend-item',
              item.hidden ? 'team-performance-chart__legend-item--hidden' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={!item.hidden}
            onClick={() => handleToggleLabel(item.label)}
            style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
          >
            <span
              className="team-performance-chart__legend-swatch"
              aria-hidden="true"
              style={{ backgroundColor: item.color }}
            />
            <span className="team-performance-chart__legend-label">
              {item.label} ({item.value})
            </span>
          </button>
        ))}
      </div>

      <Box sx={{ flex: '1', display: 'flex', justifyContent: 'flex-start', minWidth: '450px' }}>
        {visibleData.length > 0 ? (
          <PieChart
            series={[
              {
                innerRadius: 120,
                outerRadius: 220,
                paddingAngle: 4,
                cornerRadius: 10,
                startAngle: -90,
                endAngle: 270,
                cx: 250,
                cy: 250,
                data: visibleData,
              },
            ]}
            width={600}
            height={500}
            hideLegend
            slotProps={{
              tooltip: reportItemTooltipProps,
            }}
          />
        ) : (
          <div className="team-performance-chart__empty" style={{ alignSelf: 'center' }}>
            Semua kategori sedang di-disable. Klik salah satu kategori untuk menampilkan chart kembali.
          </div>
        )}
      </Box>
    </div>
  );
}
