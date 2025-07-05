import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TimeSeriesChart({ data, config }) {
  if (!data || !data.length) return null;

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: config?.primaryLabel || 'Value',
        data: data.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)', // Blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)', // Blue-600
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      },
      // Add secondary line if yoy or core values exist
      ...(data[0].yoy || data[0].core ? [{
        label: data[0].yoy ? 'YoY Change (%)' : 'Core Rate (%)',
        data: data.map(d => d.yoy || d.core),
        borderColor: 'rgb(239, 68, 68)', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(220, 38, 38)', // Red-600
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        yAxisID: 'y1',
      }] : [])
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: config?.title || 'Time Series Data',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#1f2937', // Gray-800
        padding: {
          bottom: 20
        }
      },
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280', // Gray-500
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        callbacks: {
          title: function(context) {
            const date = new Date(data[context[0].dataIndex].date);
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('%')) {
                label += context.parsed.y.toFixed(1) + '%';
              } else if (label.includes('GDP')) {
                label += '$' + context.parsed.y.toFixed(1) + 'T';
              } else {
                label += context.parsed.y.toFixed(2);
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)', // Gray-400 with opacity
          drawBorder: false
        },
        ticks: {
          color: '#6b7280', // Gray-500
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          maxTicksLimit: 6
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            if (config?.yAxisLabel?.includes('GDP')) {
              return '$' + value + 'T';
            } else if (config?.yAxisLabel?.includes('%')) {
              return value + '%';
            }
            return value;
          }
        },
        title: {
          display: true,
          text: config?.yAxisLabel || '',
          color: '#374151', // Gray-700
          font: {
            size: 13,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      ...(data[0].yoy || data[0].core ? {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
              family: 'Inter, system-ui, sans-serif'
            },
            callback: function(value) {
              return value + '%';
            }
          },
          title: {
            display: true,
            text: config?.secondaryYAxisLabel || 'YoY Change (%)',
            color: '#374151',
            font: {
              size: 13,
              weight: 'bold',
              family: 'Inter, system-ui, sans-serif'
            }
          }
        }
      } : {})
    }
  };

  return (
    <div className="relative w-full">
      <div className="h-80 w-full">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}
