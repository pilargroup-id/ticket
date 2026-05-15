import { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import { PieChart } from '@mui/x-charts/PieChart';
import TicketReports from '../../../services/reports/TicketReports.js';

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
          id: item.label,
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
    <div className="team-performance-chart" style={{ width: '100%' }}>
      <div className="team-performance-chart__legend" aria-label="Category distribution legend" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {legendItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={[
              'team-performance-chart__legend-item',
              item.hidden ? 'team-performance-chart__legend-item--hidden' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={!item.hidden}
            onClick={() => handleToggleLabel(item.label)}
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

      <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
        {visibleData.length > 0 ? (
          <PieChart
            series={[
              {
                innerRadius: 60,
                outerRadius: 120,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 180,
                cx: 150,
                cy: 150,
                data: visibleData,
              },
            ]}
            width={400}
            height={300}
            hideLegend
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
