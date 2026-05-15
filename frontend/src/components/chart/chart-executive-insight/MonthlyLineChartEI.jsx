import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { getTicketsPerMonth } from '../../../services/reports/TicketReports'

const margin = { right: 24, top: 40 };
const xLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function LineChartMonthly({ year = new Date().getFullYear() }) {
  const [pData, setPData] = useState(new Array(12).fill(0));

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getTicketsPerMonth({ year: year });
        const newData = new Array(12).fill(0);
        
        if (response.data) {
          response.data.forEach(item => {
            // item.month is 1-indexed (1-12)
            if (item.month >= 1 && item.month <= 12) {
              newData[item.month - 1] = item.count;
            }
          });
        }
        
        setPData(newData);
      } catch (error) {
        console.error('Error fetching tickets per month:', error);
      }
    }

    fetchData();
  }, [year]);

  const CustomMark = (props) => {
    const { x, y, color, dataIndex } = props;
    const value = pData[dataIndex];

    return (
      <g>
        <circle cx={x} cy={y} r={4} fill={color || 'currentColor'} />
        <text
          x={x}
          y={Number(y) - 12}
          style={{
            textAnchor: 'middle',
            dominantBaseline: 'auto',
            fill: color || 'currentColor',
            fontWeight: 'bold',
            fontSize: 12,
          }}
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <LineChart
        series={[{ 
          data: pData, 
          label: 'Tickets per Month', 
          showMark: true,
          color: '#3b82f6', // Premium blue color
        }]}
        xAxis={[{ scaleType: 'point', data: xLabels }]}
        yAxis={[{ width: 50 }]}
        margin={margin}
        slots={{
          mark: CustomMark,
        }}
        skipAnimation={true}
      />
    </Box>
  );
}
