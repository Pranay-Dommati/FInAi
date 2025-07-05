import { useState } from 'react';

export default function RiskMatrix({ data, config }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!data || !data.length) return null;

  const riskLevels = ['low', 'medium', 'high'];
  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800',
          dot: 'bg-green-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          dot: 'bg-yellow-500'
        };
      case 'high':
        return {
          bg: 'bg-red-100',
          border: 'border-red-300',
          text: 'text-red-800',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-800',
          dot: 'bg-gray-500'
        };
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">⚠️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {config?.title || 'Risk Matrix'}
          </h3>
          <p className="text-sm text-slate-600">Economic risk assessment by factor</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const riskColors = getRiskColor(item.risk);
          const riskIcon = getRiskIcon(item.risk);
          
          return (
            <div
              key={item.factor}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                hoveredCell === index 
                  ? `${riskColors.bg} ${riskColors.border} shadow-lg transform scale-[1.02]` 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onMouseEnter={() => setHoveredCell(index)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{riskIcon}</div>
                  <div>
                    <h4 className="font-medium text-slate-800">{item.factor}</h4>
                    <p className="text-sm text-slate-600 capitalize">
                      {item.risk} risk level
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700">
                      Risk Score
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {(item.value * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="w-24 h-6 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.risk.toLowerCase() === 'low' ? 'bg-green-500' :
                        item.risk.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${item.value * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {hoveredCell === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Risk Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Risk Levels</h4>
        <div className="flex justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low (0-30%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Medium (30-70%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High (70-100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
