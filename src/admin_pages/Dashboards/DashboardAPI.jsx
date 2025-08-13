import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function APIDashboard() {
  const [timeFilter, setTimeFilter] = useState('Week');
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
            value="ALL API SERVICES"
            onChange={() => {}}
          >
            <option>ALL API SERVICES</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-gray-700 rounded text-sm">New</button>
          <button className="px-3 py-1 bg-gray-700 rounded text-sm">Show All</button>
          <button className="px-3 py-1 bg-gray-700 rounded text-sm">Explorer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">RESPONSE & ERRORS</h2>
            <div className="flex items-center space-x-4">
              <select 
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
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
                  <span>Response</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-green-400 mr-2"></div>
                  <span>Error</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* HTTP Status Codes */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">HTTP status code</h3>
            <span className="text-xs text-gray-400">Shows 5th</span>
          </div>
          
          <div className="space-y-3">
            {statusData.map((item) => (
              <div key={item.code} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono">{item.code}</span>
                  <div className="w-24 h-2 bg-gray-700 rounded">
                    <div 
                      className="h-2 rounded"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* HTTP Methods */}
        <div className="bg-gray-800 rounded-lg p-6 lg:col-start-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">HTTP Methods</h3>
            <span className="text-xs text-gray-400">Shows 5th</span>
          </div>
          
          <div className="space-y-3">
            {methodData.map((item) => (
              <div key={item.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono">{item.method}</span>
                  <div className="w-24 h-2 bg-gray-700 rounded">
                    <div 
                      className="h-2 rounded"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Logs Table */}
        <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button className="px-3 py-1 bg-gray-700 rounded text-sm">
              Filter request_method
            </button>
            <button className="px-2 py-1 bg-gray-700 rounded text-xs">
              Analisar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-left py-2">Method</th>
                  <th className="text-left py-2">Endpoint</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {apiLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
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
  