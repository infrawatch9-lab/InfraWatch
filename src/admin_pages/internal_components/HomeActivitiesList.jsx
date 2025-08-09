// src/components/ActivityList.jsx
import { Activity } from 'lucide-react';

const activities = [
  { text: 'Limite de uso de CPU atualizado', time: 'Just now' },
  { text: 'Serviço de autenticação reiniciado', time: '19 minutes ago' },
  { text: 'Submitted a bug', time: '12 hours ago' },
  { text: 'Modified A data in Page X', time: 'Today, 11:59 AM' },
  { text: 'Deleted a page in Project X', time: 'Feb 2, 2025' }
];

export default function ActivitiesList() {
  return (
    <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
      <h2 className="text-gray-200 font-semibold mb-4">Actividades</h2>
      <ul className="space-y-3">
        {activities.map((item, idx) => (
          <li key={idx} className="flex items-center gap-3 text-gray-300">
            <Activity className="text-blue-400 w-5 h-5" />
            <div>
              <p>{item.text}</p>
              <span className="text-xs text-gray-500">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
