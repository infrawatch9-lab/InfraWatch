import React, { useState } from "react";
import { Filter, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import TopBar from "../components/Topbar";
import StatusTable from "./internal_components/MonitorStatusTable";
import Pagination from "./internal_components/MonitorPagination";
import { useTranslation } from 'react-i18next';

export default function MonitorAdmin() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 6;
  const navigate = useNavigate();

  const services = [
    t('monitor.servers'),
    t('monitor.apis'),
    t('monitor.networks'),
    t('monitor.webhooks')
  ];

  // Dados simulados com serviços aleatórios
  const statusData = [
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.two_point_zero_one_seconds'), status: t('status_badge.at_risk') },
    { sla: t('monitor.response_time'), limite: t('monitor.two_seconds'), medido: t('monitor.four_seconds'), status: t('status_badge.error') },
    { sla: t('monitor.monthly_uptime'), limite: t('monitor.min_9999'), medido: t('monitor.uptime_guaranteed'), status: t('status_badge.fulfilled') }
  ].map(item => ({
    ...item,
    servico: services[Math.floor(Math.random() * services.length)]
  }));

  const handleRowClick = (item) => {
    switch (item.servico) {
      case t('monitor.apis'):
        navigate("/admin/dashboard_api_admin");
        break;
      case t('monitor.servers'):
        navigate("/admin/dashboard_servers_admin");
        break;
      case t('monitor.networks'):
        navigate("/admin/dashboard_networks_admin");
        break;
      case t('monitor.webhooks'):
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
            <h1 className="text-2xl font-bold text-white mb-1">{t('monitor.title')}</h1>
            <p className="text-slate-400">{t('monitor.subtitle')}</p>
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
