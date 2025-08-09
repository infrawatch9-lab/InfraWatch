import { Server, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SystemOverview() {
  return (
    <div className="bg-[#0B1440] p-4 rounded-md shadow-lg">
      <h2 className="text-gray-200 font-semibold mb-4">Visão Geral dos Sistemas</h2>

      <div className="space-y-6">
        {/* Serviços em falha */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Server className="text-red-500" />
              <span className="text-white">Serviços em falha</span>
            </div>
            <span className="text-white">6/10</span>
          </div>
          <div className="w-full bg-[#1E2A5C] rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Alertas Ativos */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-400" />
              <span className="text-white">Alertas Ativos</span>
            </div>
            <span className="text-white">112/203</span>
          </div>
          <div className="w-full bg-[#1E2A5C] rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "55%" }} />
          </div>
        </div>

        {/* Disponibilidade do Sistema */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-400" />
              <span className="text-white">Disponibilidade do Sistema</span>
            </div>
            <span className="text-white">97%</span>
          </div>
          <div className="w-full bg-[#1E2A5C] rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: "97%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
