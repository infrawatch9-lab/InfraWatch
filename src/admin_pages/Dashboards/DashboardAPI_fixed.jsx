import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import TopBar from '../../components/Topbar';

export default function APIDashboard() {
  const [timeFilter, setTimeFilter] = useState('Week');
  const [chartType, setChartType] = useState('line'); // 'line', 'area', 'bar'
  const [data, setData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [methodData, setMethodData] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);

  // Simulated data - replace with real API calls
  useEffect(() => {
    // Main chart data
    const chartData = [
      { name: 'X0', response: 4.5, error: 1.2 },
      { name: 'X1', response: 4.2, error: 1.8 },
      { name: 'X2', response: 3.8, error: 1.5 },
      { name: 'X3', response: 4.1, error: 1.9 },
      { name: 'X4', response: 3.9, error: 1.4 },
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
  }, [timeFilter]);

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
    const commonProps = {
      data: data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Area
              type="monotone"
              dataKey="response"
              stroke="#60A5FA"
              strokeWidth={2}
              fill="url(#colorResponse)"
            />
            <Area
              type="monotone"
              dataKey="error"
              stroke="#34D399"
              strokeWidth={2}
              fill="url(#colorError)"
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Bar dataKey="response" fill="#60A5FA" radius={[2, 2, 0, 0]} />
            <Bar dataKey="error" fill="#34D399" radius={[2, 2, 0, 0]} />
          </BarChart>
        );
      
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Line 
              type="monotone" 
              dataKey="response" 
              stroke="#60A5FA" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="error" 
              stroke="#34D399" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
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
              className="bg-[#162050] border border-slate-700 rounded px-3 py-1 text-sm text-gray-300"
              value="ALL API SERVICES"
              onChange={() => {}}
            >
              <option>ALL API SERVICES</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-[#162050] text-gray-300 rounded text-sm hover:bg-[#1a2456] transition-colors">New</button>
            <button className="px-3 py-1 bg-[#162050] text-gray-300 rounded text-sm hover:bg-[#1a2456] transition-colors">Show All</button>
            <button className="px-3 py-1 bg-[#162050] text-gray-300 rounded text-sm hover:bg-[#1a2456] transition-colors">Explorer</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-[#0B1440] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">RESPONSE & ERRORS</h2>
              <div className="flex items-center space-x-4">
                {/* Controles de tipo de gráfico */}
                <div className="flex items-center gap-2 bg-[#162050] rounded-lg p-1">
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
                  className="bg-[#162050] border border-slate-700 rounded px-2 py-1 text-xs text-gray-300"
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
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar Direita */}
          <div className="space-y-4">
            {/* HTTP Status Code */}
            <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">HTTP status code</h3>
                <span className="text-xs text-blue-400">últimos 24h</span>
              </div>
              
              <div className="space-y-3">
                {statusData.map((item) => (
                  <div key={item.code} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-gray-300">{item.code}</span>
                      <div className="w-24 h-2 bg-slate-700 rounded">
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
            <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">HTTP Methods</h3>
                <span className="text-xs text-blue-400">últimos 24h</span>
              </div>
              
              <div className="space-y-3">
                {methodData.map((item) => (
                  <div key={item.method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-gray-300">{item.method}</span>
                      <div className="w-24 h-2 bg-slate-700 rounded">
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
        <div className="bg-[#0B1440] rounded-lg p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <button className="px-3 py-1 bg-[#162050] text-gray-300 rounded text-sm hover:bg-[#1a2456] transition-colors">
              Filter request, method
            </button>
            <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
              Analisar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-slate-700">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-left py-2">Method</th>
                  <th className="text-left py-2">Endpoint</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {apiLogs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
