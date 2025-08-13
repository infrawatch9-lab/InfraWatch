import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Server, Cpu, HardDrive, Wifi } from 'lucide-react';
import { useState } from 'react';

const data = [
  { time: '00:00', cpu: 30, memory: 45, network: 20, storage: 60 },
  { time: '04:00', cpu: 15, memory: 35, network: 15, storage: 58 },
  { time: '08:00', cpu: 40, memory: 60, network: 35, storage: 62 },
  { time: '12:00', cpu: 35, memory: 55, network: 30, storage: 65 },
  { time: '16:00', cpu: 50, memory: 70, network: 45, storage: 68 },
  { time: '20:00', cpu: 65, memory: 80, network: 55, storage: 70 },
  { time: '24:00', cpu: 45, memory: 65, network: 40, storage: 72 }
];

const metrics = [
  { key: 'cpu', label: 'CPU', color: '#8B5CF6', icon: Cpu, current: '45%' },
  { key: 'memory', label: 'Memória', color: '#06B6D4', icon: HardDrive, current: '65%' },
  { key: 'network', label: 'Rede', color: '#10B981', icon: Wifi, current: '40%' },
  { key: 'storage', label: 'Armazenamento', color: '#F59E0B', icon: Server, current: '72%' }
];

export default function ResourceConsumptionChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('cpu');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1440] border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{`Hora: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-[#0B1440] to-[#0F1937] p-6 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Server className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Consumo de Recursos</h2>
            <p className="text-gray-400 text-sm">Monitoramento em tempo real</p>
          </div>
        </div>

        <div className="flex gap-2">
          {['1h', '6h', '24h', '7d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedPeriod === period
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-[#162050] text-gray-300 hover:bg-[#1a2456] hover:text-white'
                }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isSelected = selectedMetric === metric.key;
          return (
            <div
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${isSelected
                  ? 'bg-slate-700/50 border-2 border-blue-500'
                  : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-700/30'
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5" style={{ color: metric.color }} />
                <span className="text-gray-300 text-sm font-medium">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-lg font-bold">{metric.current}</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
          );
        })}
      </div>
      Metrics Cards */}

      {/* 
      <div className="bg-[#0A1235]/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {metrics.map((metric) => (
                <linearGradient key={metric.key} id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {selectedMetric === 'cpu' && (
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#8B5CF6"
                strokeWidth={3}
                fill="url(#gradient-cpu)"
                dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }}
              />
            )}

            {selectedMetric === 'memory' && (
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#06B6D4"
                strokeWidth={3}
                fill="url(#gradient-memory)"
                dot={{ r: 4, fill: "#06B6D4", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#06B6D4", strokeWidth: 2, stroke: "#fff" }}
              />
            )}

            {selectedMetric === 'network' && (
              <Area
                type="monotone"
                dataKey="network"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#gradient-network)"
                dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
              />
            )}

            {selectedMetric === 'storage' && (
              <Area
                type="monotone"
                dataKey="storage"
                stroke="#F59E0B"
                strokeWidth={3}
                fill="url(#gradient-storage)"
                dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      Chart */}

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-700/50 gap-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Atualizado há 30 segundos</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Próxima atualização em:</span>
          <span className="text-blue-400 font-medium">00:30</span>
        </div>
      </div>
    </div>
  );
}
