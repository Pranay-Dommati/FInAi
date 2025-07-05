import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3b82f6', // Blue-500
  '#ef4444', // Red-500
  '#10b981', // Emerald-500
  '#f59e0b', // Amber-500
  '#8b5cf6', // Violet-500
  '#06b6d4', // Cyan-500
  '#f97316', // Orange-500
  '#84cc16', // Lime-500
];

export default function GlobalDistribution({ data, config }) {
  if (!data || !data.length) return null;

  // Add colors to data
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-800">
            {getCountryFlag(data.country)} {data.country}
          </p>
          <p className="text-sm text-slate-600">
            GDP: <span className="font-semibold">${data.value}T</span>
          </p>
          <p className="text-sm text-slate-600">
            Share: <span className="font-semibold">{data.share}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, country, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show labels for slices larger than 5%
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-medium text-sm"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))' }}
      >
        {`${getCountryFlag(country)} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">🌍</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {config?.title || 'Global GDP Distribution'}
          </h3>
          <p className="text-sm text-slate-600">Economic contribution by region</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              stroke="#fff"
              strokeWidth={3}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Total Global GDP</h4>
          <p className="text-2xl font-bold text-slate-800">
            ${dataWithColors.reduce((sum, item) => sum + item.value, 0).toFixed(1)}T
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Countries Tracked</h4>
          <p className="text-2xl font-bold text-slate-800">
            {dataWithColors.length}
          </p>
        </div>
      </div>

      {/* Country Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Countries by GDP</h4>
        <div className="space-y-2">
          {dataWithColors
            .sort((a, b) => b.value - a.value)
            .map((item, index) => (
              <div key={item.country} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700">
                    {getCountryFlag(item.country)} {item.country}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800">${item.value}T</div>
                  <div className="text-xs text-slate-500">{item.share}%</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to get country flags
function getCountryFlag(country) {
  const flags = {
    'United States': '🇺🇸',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'Germany': '🇩🇪',
    'India': '🇮🇳',
    'United Kingdom': '🇬🇧',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Brazil': '🇧🇷',
    'Canada': '🇨🇦',
  };
  return flags[country] || '🌐';
}
