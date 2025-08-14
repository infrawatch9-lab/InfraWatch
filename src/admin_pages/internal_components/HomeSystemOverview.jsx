import { Server, AlertTriangle, CheckCircle2, TrendingUp, Activity } from "lucide-react";

export default function SystemOverview() {
  const systemStats = [
    {
      id: 1,
      label: "Serviços em Falha",
      value: "6",
      total: "10",
      percentage: 60,
      icon: Server,
      color: "red",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-400",
      barColor: "bg-red-500",
      trend: "down"
    },
    {
      id: 2,
      label: "Alertas Ativos",
      value: "112",
      total: "203",
      percentage: 55,
      icon: AlertTriangle,
      color: "yellow",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      barColor: "bg-yellow-400",
      trend: "up"
    },
    {
      id: 3,
      label: "Disponibilidade",
      value: "97",
      total: "100",
      percentage: 97,
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-400",
      barColor: "bg-green-400",
      trend: "up",
      suffix: "%"
    }
  ];

  return (
    <div className="bg-[#0B1440] p-6 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          Visão Geral dos Sistemas
        </h2>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>

      <div className="space-y-6">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-200 font-medium text-sm sm:text-base">{stat.label}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className={`w-3 h-3 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'} ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                      <span className="text-xs text-gray-400">
                        {stat.trend === 'up' ? 'Aumentou' : 'Diminuiu'} nas últimas 24h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">
                    {stat.value}{stat.suffix || ''}/{stat.total}{stat.suffix && stat.suffix !== '%' ? stat.suffix : ''}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {stat.percentage}%
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-[#1E2A5C]/60 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`${stat.barColor} h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                    style={{ width: `${stat.percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0</span>
                  <span>{stat.total}{stat.suffix || ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status geral */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Status Geral do Sistema</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold text-sm">Operacional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
