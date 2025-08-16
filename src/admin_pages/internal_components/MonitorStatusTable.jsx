import React from "react";
import StatusBadge from "./MonitorStatusBadge";
import { useTranslation } from 'react-i18next';

export default function StatusTable({ data, searchTerm, onRowClick }) {
  const { t } = useTranslation();
  const filteredData = data.filter(item =>
    item.sla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.limite.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.medido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.servico && item.servico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="rounded-lg border border-slate-600 overflow-hidden"
      style={{ backgroundColor: "#020E36" }}
    >
      {/* Table Header */}
      <div
        className="grid grid-cols-5 gap-4 p-4 border-b border-slate-600"
        style={{ backgroundColor: "#0B1440" }}
      >
        <div className="text-white font-semibold text-sm">{t('internal.sla')}</div>
        <div className="text-white font-semibold text-sm">{t('internal.limit')}</div>
        <div className="text-white font-semibold text-sm">{t('internal.measured')}</div>
        <div className="text-white font-semibold text-sm">{t('internal.status')}</div>
        <div className="text-white font-semibold text-sm">{t('internal.service')}</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-600">
        {filteredData.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 p-4 transition-colors cursor-pointer"
            style={{ backgroundColor: "#0B1440" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#06194d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B1440")}
            onClick={() => onRowClick && onRowClick(item)}
          >
            <div className="text-slate-300 text-sm">{item.sla}</div>
            <div className="text-slate-300 text-sm">{item.limite}</div>
            <div className="text-slate-300 text-sm">{item.medido}</div>
            <div className="flex items-center">
              <StatusBadge status={item.status} />
            </div>
            <div className="text-slate-300 text-sm">{item.servico || t('internal.none')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
