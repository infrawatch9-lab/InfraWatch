// src/components/IncidentChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { name: 'Jan', stable: 120, unstable: 30 },
  { name: 'Feb', stable: 100, unstable: 40 },
  { name: 'Mar', stable: 140, unstable: 20 },
  { name: 'Apr', stable: 90, unstable: 50 },
  { name: 'May', stable: 160, unstable: 10 },
  { name: 'Jun', stable: 130, unstable: 25 }
];

export default function IncidentHistoryChart() {
  return (
    <div className="bg-[#0B1440] p-4 rounded-md shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-200 font-semibold">Histórico de Incidentes</h2>
        <span className="text-xs text-gray-400">Últimos 6 meses</span>
      </div>

      <ResponsiveContainer width="80%" height={250}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2A5C" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A223F",
              border: "none",
              borderRadius: "2px",
              color: "#fff"
            }}
          />
          <Bar dataKey="stable" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="unstable" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
