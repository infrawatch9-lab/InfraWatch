// components/ResourceConsumptionChart.jsx
// src/components/ResourceChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 30 },
  { name: 'Feb', value: 15 },
  { name: 'Mar', value: 40 },
  { name: 'Apr', value: 35 },
  { name: 'May', value: 50 },
  { name: 'Jun', value: 100 },
];

export default function ResourceConsumptionChart() {
  return (
    <div className="bg-[#0B1440] p-6 rounded-md shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-green-400 font-semibold">Servidores <span className="text-gray-300 font-normal">| Consumo de Recursos</span></h2>
        <div className="flex gap-2">
          <button className="bg-[#162050] text-white px-3 py-1 rounded text-sm">Week</button>
          <button className="bg-[#162050] text-white px-3 py-1 rounded text-sm">Month</button>
        </div>
      </div>
      <ResponsiveContainer width="80%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" />
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: "#fff" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
