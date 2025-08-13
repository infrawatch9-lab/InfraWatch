import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, Filter, RefreshCw, Search, Globe, Activity, Clock, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity as AreaChartIcon } from 'lucide-react';
import TopBar from '../../components/Topbar';

// Dados de exemplo para o gráfico de Response & Errors
const responseData = [
  { time: 'X0', response: 4.5, error: 1.2 },
  { time: 'X1', response: 3.8, error: 1.8 },
  { time: 'X2', response: 4.2, error: 0.8 },
  { time: 'X3', response: 3.5, error: 2.1 },
  { time: 'X4', response: 4.8, error: 1.5 },
];

// Dados para HTTP Status Code
const statusCodeData = [
  { code: '500', value: 35, color: '#EF4444', label: '500', percentage: '35%' },
  { code: '404', value: 12, color: '#F97316', label: '404', percentage: '12%' },
  { code: '301', value: 5, color: '#EAB308', label: '301', percentage: '5%' },
  { code: '200', value: 15, color: '#22C55E', label: '200', percentage: '15%' },
  { code: '503', value: 18, color: '#8B5CF6', label: '503', percentage: '18%' },
];

// Dados para HTTP Methods
const httpMethodsData = [
  { method: 'GET', value: 35, color: '#EF4444', percentage: '35%' },
  { method: 'PUT', value: 5, color: '#3B82F6', percentage: '5%' },
  { method: 'POST', value: 12, color: '#F59E0B', percentage: '12%' },
  { method: 'DELETE', value: 18, color: '#10B981', percentage: '18%' },
];

// Dados de logs
const apiLogs = [
  { 
    timestamp: '2025-01-17 09:21:02',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
  { 
    timestamp: '2025-01-17 09:21:02',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
  { 
    timestamp: '2025-02-10 19:01:27',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '500 ER',
    time: '120ms',
    statusColor: 'bg-red-500'
  },
  { 
    timestamp: '2025-02-10 19:01:27',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
  { 
    timestamp: '2025-01-17 09:21:02',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
  { 
    timestamp: '2025-01-17 09:21:02',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
  { 
    timestamp: '2025-01-17 09:21:02',
    method: 'GET',
    endpoint: '/httpbin/delete',
    status: '200 OK',
    time: '120ms',
    statusColor: 'bg-green-500'
  },
];

export default function DashboardAPI() {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const [selectedServices, setSelectedServices] = useState('ALL API SERVICES');
  const [chartType, setChartType] = useState('area'); // area, line, bar
  const [statusCodeViewType, setStatusCodeViewType] = useState('list'); // list, pie
  const [methodsViewType, setMethodsViewType] = useState('list'); // list, bar

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1440] border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">{entry.dataKey === 'response' ? 'Response' : 'Error'}:</span>
              <span className="font-medium text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderMainChart = () => {
    const commonProps = {
      data: responseData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['Y0', 'Y5']} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="response" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
            <Line type="monotone" dataKey="error" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['Y0', 'Y5']} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="response" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="error" fill="#10B981" radius={[2, 2, 0, 0]} />
          </BarChart>
        );
      
      default: // area
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['Y0', 'Y5']} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="response" stroke="#3B82F6" strokeWidth={2} fill="url(#colorResponse)" />
            <Area type="monotone" dataKey="error" stroke="#10B981" strokeWidth={2} fill="url(#colorError)" />
          </AreaChart>
        );
    }
  };

  const renderStatusCodeChart = () => {
    if (statusCodeViewType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={statusCodeData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {statusCodeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${props.payload.percentage}`, 
                `Status ${props.payload.code}`
              ]}
              contentStyle={{
                backgroundColor: '#0B1440',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <div className="space-y-3">
        {statusCodeData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-300 text-sm">{item.label}</span>
            </div>
            <span className="text-white text-sm font-medium">{item.percentage}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMethodsChart = () => {
    if (methodsViewType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={httpMethodsData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="method" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              formatter={(value, name, props) => [
                `${props.payload.percentage}`, 
                `${props.payload.method} Method`
              ]}
              contentStyle={{
                backgroundColor: '#0B1440',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <div className="space-y-3">
        {httpMethodsData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-300 text-sm">{item.method}</span>
            </div>
            <span className="text-white text-sm font-medium">{item.percentage}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#081028]">
      {/* Topbar */}
      <TopBar />

      {/* Header com controles */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-[#162050] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#1a2456] transition-colors">
              <span>{selectedServices}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedPeriod('Week')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedPeriod === 'Week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#162050] text-gray-300 hover:bg-[#1a2456]'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setSelectedPeriod('Month')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedPeriod === 'Month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#162050] text-gray-300 hover:bg-[#1a2456]'
              }`}
            >
              Month
            </button>
            <button className="p-2 bg-[#162050] text-gray-300 rounded-lg hover:bg-[#1a2456] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-[#162050] text-gray-300 rounded-lg hover:bg-[#1a2456] transition-colors text-sm">
              Explorer
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Coluna Principal - Gráfico de Response & Errors */}
          <div className="lg:col-span-2">
            <div className="bg-[#0B1440] p-6 rounded-lg shadow-lg h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-semibold text-lg">RESPONSE & ERRORS</h2>
                <div className="flex items-center gap-4">
                  {/* Controles de tipo de gráfico */}
                  <div className="flex items-center gap-2 bg-[#162050] rounded-lg p-1">
                    <button
                      onClick={() => setChartType('area')}
                      className={`p-2 rounded transition-colors ${
                        chartType === 'area' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Area Chart"
                    >
                      <AreaChartIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`p-2 rounded transition-colors ${
                        chartType === 'line' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Line Chart"
                    >
                      <LineChartIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`p-2 rounded transition-colors ${
                        chartType === 'bar' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Bar Chart"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Legenda */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-400 text-sm">Response</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-gray-400 text-sm">Error</span>
                    </div>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                {renderMainChart()}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar Direita */}
          <div className="space-y-6">
            {/* HTTP Status Code */}
            <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">HTTP status code</h3>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs">últimos 24h</span>
                  <div className="flex bg-[#162050] rounded p-1">
                    <button
                      onClick={() => setStatusCodeViewType('list')}
                      className={`p-1 rounded transition-colors ${
                        statusCodeViewType === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setStatusCodeViewType('pie')}
                      className={`p-1 rounded transition-colors ${
                        statusCodeViewType === 'pie' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Pie Chart"
                    >
                      <PieChartIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {renderStatusCodeChart()}
            </div>

            {/* HTTP Methods */}
            <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">HTTP Methods</h3>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs">últimos 24h</span>
                  <div className="flex bg-[#162050] rounded p-1">
                    <button
                      onClick={() => setMethodsViewType('list')}
                      className={`p-1 rounded transition-colors ${
                        methodsViewType === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setMethodsViewType('bar')}
                      className={`p-1 rounded transition-colors ${
                        methodsViewType === 'bar' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Bar Chart"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {renderMethodsChart()}
            </div>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="mt-6 bg-[#0B1440] rounded-lg shadow-lg">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Filtrar request, method</h3>
              <button className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                Analisar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A1235]">
                <tr>
                  <th className="text-left p-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left p-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Method
                  </th>
                  <th className="text-left p-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="text-left p-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right p-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {apiLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-gray-300 text-sm">
                      {log.timestamp}
                    </td>
                    <td className="p-3">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                        {log.method}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300 text-sm">
                      {log.endpoint}
                    </td>
                    <td className="p-3">
                      <span className={`${log.statusColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300 text-sm text-right">
                      {log.time}
                    </td>
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
