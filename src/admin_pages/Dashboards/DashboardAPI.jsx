import React, { useState, useEffect } from "react";
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import TopBar from '../../components/Topbar';

export default function APIDashboard() {
  const [timeFilter, setTimeFilter] = useState('Week');
  const [chartType, setChartType] = useState('line'); // 'line', 'area', 'bar'
  const [data, setData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [methodData, setMethodData] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filterColumn, setFilterColumn] = useState('all');
  const [filterValue, setFilterValue] = useState('');

  // Simulated data - replace with real API calls
  useEffect(() => {
    // Main chart data
    const chartData = [
      { x: 'X0', response: 4.5, error: 1.2 },
      { x: 'X1', response: 14.2, error: 1.8 },
      { x: 'X2', response: 3.8, error: 1.5 },
      { x: 'X3', response: 24.1, error: 1.9 },
      { x: 'X4', response: 3.9, error: 1.4 },
      { x: 'X5', response: 4.5, error: 1.2 },
      { x: 'X6', response: 14.2, error: 1.8 },
      { x: 'X7', response: 3.8, error: 1.5 },
      { x: 'X8', response: 24.1, error: 1.9 },
      { x: 'X9', response: 3.9, error: 1.4 },
      { x: 'X10', response: 4.5, error: 1.2 },
      { x: 'X11', response: 14.2, error: 1.8 },
      { x: 'X12', response: 3.8, error: 1.5 },
      { x: 'X13', response: 24.1, error: 1.9 },
      { x: 'X14', response: 3.9, error: 1.4 },
    ];

    // HTTP Status codes data
    const statusCodes = [
      { code: '500', percentage: 35, color: '#FF6B6B' },
      { code: '404', percentage: 12, color: '#4ECDC4' },
      { code: '301', percentage: 8, color: '#45B7D1' },
      { code: '300', percentage: 15, color: '#96CEB4' },
      { code: '200', percentage: 30, color: '#FFEAA7' },
    ];

    // HTTP Methods data
    const methods = [
      { method: 'GET', percentage: 95, color: '#FF6B6B' },
      { method: 'PUT', percentage: 3, color: '#4ECDC4' },
      { method: 'POST', percentage: 12, color: '#45B7D1' },
      { method: 'DELETE', percentage: 16, color: '#96CEB4' },
    ];

    // API logs
    const logs = [
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
      { timestamp: '2025-02-16 19:01:27', method: 'GET', endpoint: '/httpbin/delete', status: '500 ER', responseTime: '120ms' },
      { timestamp: '2025-02-16 19:01:27', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' },
    ];

    setData(chartData);
    setStatusData(statusCodes);
    setMethodData(methods);
    setApiLogs(logs);
    setFilteredLogs(logs);
  }, [timeFilter]);

  // Filtrar logs baseado no filtro selecionado
  useEffect(() => {
    if (filterColumn === 'all' || filterValue === '') {
      setFilteredLogs(apiLogs);
    } else {
      const filtered = apiLogs.filter(log => {
        switch (filterColumn) {
          case 'method':
            return log.method.toLowerCase().includes(filterValue.toLowerCase());
          case 'endpoint':
            return log.endpoint.toLowerCase().includes(filterValue.toLowerCase());
          case 'status':
            return log.status.toLowerCase().includes(filterValue.toLowerCase());
          case 'timestamp':
            return log.timestamp.toLowerCase().includes(filterValue.toLowerCase());
          case 'responseTime':
            return log.responseTime.toLowerCase().includes(filterValue.toLowerCase());
          default:
            return true;
        }
      });
      setFilteredLogs(filtered);
    }
  }, [apiLogs, filterColumn, filterValue]);

  const getStatusColor = (status) => {
    if (status.includes('200')) return 'text-green-400';
    if (status.includes('500')) return 'text-red-400';
    if (status.includes('404')) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-green-600';
      case 'POST': return 'bg-blue-600';
      case 'PUT': return 'bg-yellow-600';
      case 'DELETE': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const renderChart = () => {
    const xLabels = data.map(item => item.x);
    const responseData = data.map(item => item.response);
    const errorData = data.map(item => item.error);

    const commonLineProps = {
      xAxis: [{ 
        scaleType: 'point', 
        data: xLabels,
        tickLabelStyle: { fill: '#94A3B8' }
      }],
      series: [
        {
          data: responseData,
          label: 'Response',
          color: '#60A5FA',
        },
        {
          data: errorData,
          label: 'Error',
          color: '#34D399',
        },
      ],
      width: undefined,
      height: 400,
      grid: { horizontal: true, vertical: true },
      sx: {
        '& .MuiChartsAxis-line': {
          stroke: '#3B5B75',
        },
        '& .MuiChartsAxis-tick': {
          stroke: '#3B5B75',
        },
        '& .MuiChartsAxis-tickLabel': {
          fill: '#94A3B8',
        },
        '& .MuiChartsGrid-line': {
          stroke: '#3B5B75',
          strokeDasharray: '3 3',
        },
      },
    };

    const barProps = {
      xAxis: [{ 
        scaleType: 'band', 
        data: xLabels,
        tickLabelStyle: { fill: '#94A3B8' }
      }],
      series: [
        {
          data: responseData,
          label: 'Response',
          color: '#60A5FA',
        },
        {
          data: errorData,
          label: 'Error',
          color: '#34D399',
        },
      ],
      width: undefined,
      height: 400,
      sx: {
        '& .MuiChartsAxis-line': {
          stroke: '#3B5B75',
        },
        '& .MuiChartsAxis-tick': {
          stroke: '#3B5B75',
        },
        '& .MuiChartsAxis-tickLabel': {
          fill: '#94A3B8',
        },
        '& .MuiChartsGrid-line': {
          stroke: '#3B5B75',
          strokeDasharray: '3 3',
        },
      },
    };

    switch (chartType) {
      case 'area':
        return (
          <LineChart
            {...commonLineProps}
            series={[
              {
                data: responseData,
                label: 'Response',
                color: '#60A5FA',
                area: true,
              },
              {
                data: errorData,
                label: 'Error',
                color: '#34D399',
                area: true,
              },
            ]}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            {...barProps}
          />
        );
      
      default: // line
        return (
          <LineChart
            {...commonLineProps}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#081028]">
      {/* Topbar */}
      <TopBar />
      
      {/* Main Content */}
      <div className="p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select 
              className="bg-[#010E37] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300"
              value="ALL API SERVICES"
              onChange={() => {}}
            >
              <option>ALL API SERVICES</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors">New</button>
            <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors">Show All</button>
            <button className="px-3 py-1 bg-[#010E37] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors">Explorer</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-[#0B1440] rounded-lg p-6 border border-[#3B5B75]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">RESPONSE & ERRORS</h2>
              <div className="flex items-center space-x-4">
                {/* Controles de tipo de gráfico */}
                <div className="flex items-center gap-2 bg-[#0E1A3D] rounded-lg p-1 border border-[#3B5B75]">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      chartType === 'line' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Line Chart"
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      chartType === 'area' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Area Chart (Ondular)"
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      chartType === 'bar' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Bar Chart"
                  >
                    Bar
                  </button>
                </div>
                
                <select 
                  className="bg-[#010E37] border border-[#3B5B75] rounded px-2 py-1 text-xs text-gray-300"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option>Week</option>
                  <option>Day</option>
                  <option>Month</option>
                </select>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-blue-400 mr-2"></div>
                    <span className="text-gray-400">Response</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-green-400 mr-2"></div>
                    <span className="text-gray-400">Error</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-96">
              {renderChart()}
            </div>
          </div>

          {/* Sidebar Direita */}
          <div className="space-y-4">
            {/* HTTP Status Code */}
            <div className="bg-[#0B1440] p-6 rounded-lg shadow-lg border border-[#3B5B75]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">HTTP status code</h3>
                <span className="text-xs text-blue-400">últimos 24h</span>
              </div>
              
              <div className="space-y-4">
                {statusData.map((item) => (
                  <div key={item.code} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-gray-300">{item.code}</span>
                      <div className="w-24 h-2 bg-[#3B5B75] rounded">
                        <div 
                          className="h-2 rounded"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* HTTP Methods */}
            <div className="bg-[#0B1440] p-6 rounded-lg shadow-lg border border-[#3B5B75]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">HTTP Methods</h3>
                <span className="text-xs text-blue-400">últimos 24h</span>
              </div>
              
              <div className="space-y-4">
                {methodData.map((item) => (
                  <div key={item.method} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-gray-300">{item.method}</span>
                      <div className="w-24 h-2 bg-[#3B5B75] rounded">
                        <div 
                          className="h-2 rounded"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* API Logs Table */}
        <div className="bg-[#0B1440] rounded-lg p-6 mt-6 border border-[#3B5B75]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Dropdown para selecionar coluna */}
              <select 
                className="bg-[#0E1A3D] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
              >
                <option value="all">Filtrar por...</option>
                <option value="method">Method</option>
                <option value="endpoint">Endpoint</option>
                <option value="status">Status</option>
                <option value="timestamp">Timestamp</option>
                <option value="responseTime">Response Time</option>
              </select>
              
              {/* Input para valor do filtro */}
              {filterColumn !== 'all' && (
                <input
                  type="text"
                  placeholder={`Filtrar por ${filterColumn}...`}
                  className="bg-[#0E1A3D] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300 placeholder-gray-500"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              )}
              
              {/* Botão para limpar filtros */}
              {(filterColumn !== 'all' || filterValue !== '') && (
                <button 
                  onClick={() => {
                    setFilterColumn('all');
                    setFilterValue('');
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            
            <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
              Analisar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-[#3B5B75]">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-left py-2">Method</th>
                  <th className="text-left py-2">Endpoint</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} className="border-b border-[#3B5B75] hover:bg-[#0E1A3D]/50 transition-colors">
                    <td className="py-2 text-gray-300">{log.timestamp}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2 text-gray-300 font-mono">{log.endpoint}</td>
                    <td className={`py-2 ${getStatusColor(log.status)}`}>{log.status}</td>
                    <td className="py-2 text-gray-300">{log.responseTime}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      Nenhum resultado encontrado para o filtro aplicado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
