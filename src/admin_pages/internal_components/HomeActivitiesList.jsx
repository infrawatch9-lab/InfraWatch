import { Activity, Clock, AlertCircle, CheckCircle, Info, Trash2, Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const activities = [
  {
    id: 1,
    text: 'Limite de uso de CPU atualizado',
    time: 'Agora mesmo',
    type: 'update',
    icon: Settings,
    color: 'blue',
    priority: 'medium'
  },
  {
    id: 2,
    text: 'Serviço de autenticação reiniciado',
    time: '19 minutos atrás',
    type: 'restart',
    icon: RefreshCw,
    color: 'green',
    priority: 'high'
  },
  {
    id: 3,
    text: 'Bug reportado no sistema de logs',
    time: '12 horas atrás',
    type: 'bug',
    icon: AlertCircle,
    color: 'red',
    priority: 'high'
  },
  {
    id: 4,
    text: 'Dados modificados na página X',
    time: 'Hoje, 11:59',
    type: 'info',
    icon: Info,
    color: 'yellow',
    priority: 'low'
  },
  {
    id: 5,
    text: 'Página deletada no projeto X',
    time: '2 Feb, 2025',
    type: 'delete',
    icon: Trash2,
    color: 'red',
    priority: 'medium'
  },
  {
    id: 6,
    text: 'Backup automatico concluído',
    time: '1 hora atrás',
    type: 'success',
    icon: CheckCircle,
    color: 'green',
    priority: 'low'
  }
];

const priorityColors = {
  high: 'border-l-red-400 bg-red-500/5',
  medium: 'border-l-yellow-400 bg-yellow-500/5',
  low: 'border-l-green-400 bg-green-500/5'
};

const iconColors = {
  blue: 'text-blue-400 bg-blue-500/10',
  green: 'text-green-400 bg-green-500/10',
  red: 'text-red-400 bg-red-500/10',
  yellow: 'text-yellow-400 bg-yellow-500/10'
};

export default function ActivitiesList() {
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(4);

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.priority === filter;
  });

  const visibleActivities = filteredActivities.slice(0, visibleCount);

  const formatTime = (timeString) => {
    const now = new Date();
    const timeAgo = timeString.toLowerCase();

    if (timeAgo.includes('agora') || timeAgo.includes('now')) {
      return { text: timeString, badge: 'NOVO' };
    } else if (timeAgo.includes('minutos') || timeAgo.includes('minutes')) {
      return { text: timeString, badge: 'RECENTE' };
    }
    return { text: timeString, badge: null };
  };

  return (
    <div className="bg-[#0B1440] p-6 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Atividades Recentes</h2>
            <p className="text-gray-400 text-sm">Últimas atualizações do sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs">Tempo real</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Todas', count: activities.length },
          { key: 'high', label: 'Alta', count: activities.filter(a => a.priority === 'high').length },
          { key: 'medium', label: 'Média', count: activities.filter(a => a.priority === 'medium').length },
          { key: 'low', label: 'Baixa', count: activities.filter(a => a.priority === 'low').length }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${filter === filterOption.key
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
              }`}
          >
            {filterOption.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === filterOption.key ? 'bg-white/20' : 'bg-slate-600'
              }`}>
              {filterOption.count}
            </span>
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {visibleActivities.map((item) => {
          const Icon = item.icon;
          const timeInfo = formatTime(item.time);

          return (
            <div
              key={item.id}
              className={`group p-4 rounded-lg border-l-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer ${priorityColors[item.priority]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${iconColors[item.color]} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-200 text-sm font-medium leading-relaxed group-hover:text-white transition-colors duration-300">
                      {item.text}
                    </p>
                    {timeInfo.badge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${timeInfo.badge === 'NOVO' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {timeInfo.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeInfo.text}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                        }`}>
                        {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {filteredActivities.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(prev => prev + 3)}
          className="w-full mt-4 py-2 px-4 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all duration-300 text-sm font-medium border border-slate-700/50 hover:border-slate-600"
        >
          Carregar mais atividades ({filteredActivities.length - visibleCount} restantes)
        </button>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
        <span className="text-gray-400 text-xs">
          {filteredActivities.length} atividade{filteredActivities.length !== 1 ? 's' : ''}
          {filter !== 'all' && ` (${filter})`}
        </span>
        <button className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-300">
          Ver todas
        </button>
      </div>
    </div>
  );
}
