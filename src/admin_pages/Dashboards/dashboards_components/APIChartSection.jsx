import React from "react";
import { useTranslation } from "react-i18next";
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';

export default function ChartSection({ data, chartType, setChartType, timeFilter, setTimeFilter }) {
  const { t } = useTranslation();
  const xLabels = data.map(item => item.x);
  const responseData = data.map(item => item.response);
  const errorData = data.map(item => item.error);

  const commonLineProps = {
    xAxis: [{ scaleType: 'point', data: xLabels, tickLabelStyle: { fill: '#94A3B8' } }],
    series: [
      { data: responseData, label: t('api.response'), color: '#60A5FA' },
      { data: errorData, label: t('api.error'), color: '#34D399' },
    ],
    height: 400,
    grid: { horizontal: true, vertical: true },
    sx: {
      '& .MuiChartsAxis-line': { stroke: '#3B5B75' },
      '& .MuiChartsAxis-tick': { stroke: '#3B5B75' },
      '& .MuiChartsAxis-tickLabel': { fill: '#94A3B8' },
      '& .MuiChartsGrid-line': { stroke: '#3B5B75', strokeDasharray: '3 3' },
    },
  };

  const barProps = {
    xAxis: [{ scaleType: 'band', data: xLabels, tickLabelStyle: { fill: '#94A3B8' } }],
    series: [
      { data: responseData, label: t('api.response'), color: '#60A5FA' },
      { data: errorData, label: t('api.error'), color: '#34D399' },
    ],
    height: 400,
    sx: commonLineProps.sx,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <LineChart
            {...commonLineProps}
            series={[
              { data: responseData, label: t('api.response'), color: '#60A5FA', area: true },
              { data: errorData, label: t('api.error'), color: '#34D399', area: true },
            ]}
          />
        );
      case 'bar':
        return <BarChart {...barProps} />;
      default:
        return <LineChart {...commonLineProps} />;
    }
  };

  return (
    <div className="lg:col-span-2 bg-[#0B1440] rounded-lg p-6 border border-[#3B5B75]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">{t('api.chart.response_errors')}</h2>
        <div className="flex items-center space-x-4">
          {/* Chart Controls */}
          <div className="flex items-center gap-2 bg-[#0E1A3D] rounded-lg p-1 border border-[#3B5B75]">
            <button onClick={() => setChartType('line')} className={`px-3 py-1 rounded text-xs ${chartType === 'line' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Line</button>
            <button onClick={() => setChartType('area')} className={`px-3 py-1 rounded text-xs ${chartType === 'area' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Wave</button>
            <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded text-xs ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Bar</button>
          </div>

          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-[#010E37] border border-[#3B5B75] rounded px-2 py-1 text-xs text-gray-300">
            <option>Week</option>
            <option>Day</option>
            <option>Month</option>
          </select>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center"><div className="w-3 h-0.5 bg-blue-400 mr-2"></div><span className="text-white">Response</span></div>
            <div className="flex items-center"><div className="w-3 h-0.5 bg-green-400 mr-2"></div><span className="text-gray-400">Error</span></div>
          </div>
        </div>
      </div>

      <div className="h-96">{renderChart()}</div>
    </div>
  );
}
