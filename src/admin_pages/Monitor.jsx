import React, { useState } from "react";
import { Filter, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import TopBar from "../components/Topbar";
import StatusTable from "./internal_components/MonitorStatusTable";
import Pagination from "./internal_components/MonitorPagination";

export default function MonitorAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 6;
  const navigate = useNavigate();

  const services = ["Servidores", "APIs", "Redes", "Web hooks"];

  // Dados simulados com serviços aleatórios
  const statusData = [
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Dois vírgula zero um segundos', status: 'Em risco' },
    { sla: 'Tempo de Resposta', limite: 'Dois segundos', medido: 'Quatro segundos', status: 'Erro' },
    { sla: 'Uptime Mensal', limite: 'No mínimo 99,99%', medido: 'Disponibilidade garantida (>99,99%)', status: 'Cumprido' }
  ].map(item => ({
    ...item,
    servico: services[Math.floor(Math.random() * services.length)]
  }));

  const handleRowClick = (item) => {
    switch (item.servico) {
      case "APIs":
        navigate("/admin/dashboard_api_admin");
        break;
      case "Servidores":
        navigate("/admin/dashboard_servers_admin");
        break;
      case "Redes":
        navigate("/admin/dashboard_networks_admin");
        break;
      case "Web hooks":
        navigate("/admin/dashboard_webhooks_admin");
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#081028]">
      <TopBar />
      
      <main className="p-6">
        {/* Page Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Monitoramento</h1>
            <p className="text-slate-400">Status dos Serviços Web</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Table */}
        <StatusTable
          data={statusData}
          searchTerm={searchTerm}
          onRowClick={handleRowClick}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
}
