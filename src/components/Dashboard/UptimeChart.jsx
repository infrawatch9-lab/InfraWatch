import {
	LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
  } from "recharts";
  
  const data = Array.from({ length: 24 }).map((_, i) => {
	const hour = `${String(i).padStart(2, "0")}h`;
	const uptime = Math.max(98.5, Math.min(100, 98.8 + Math.random() * 1.2));
	return { hour, uptime: parseFloat(uptime.toFixed(2)) };
  });
  
  export default function UptimeChart() {
	return (
	  <div className="bg-white p-6 rounded-xl shadow">
		<h2 className="text-lg font-bold text-gray-800 mb-4">Uptime - Últimas 24h</h2>
		<ResponsiveContainer width="100%" height={300}>
		  <AreaChart data={data}>
			<XAxis dataKey="hour" stroke="#888" />
			<YAxis domain={[98.5, 100]} unit="%" stroke="#888" />
			<Tooltip />
			<Area type="monotone" dataKey="uptime" stroke="#3b82f6" fill="#bfdbfe" />
		  </AreaChart>
		</ResponsiveContainer>
	  </div>
	);
  }
  