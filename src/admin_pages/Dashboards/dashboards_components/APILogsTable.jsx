import React from "react";
import { useTranslation } from "react-i18next";

export default function LogsTable({ filteredLogs, filterColumn, setFilterColumn, filterValue, setFilterValue, getStatusColor, getMethodColor }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#0B1440] rounded-lg p-6 mt-6 border border-[#3B5B75]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} className="bg-[#0E1A3D] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300">
            <option value="all">{t('api.logs.filter_by')}</option>
            <option value="method">{t('api.logs.method')}</option>
            <option value="endpoint">{t('api.logs.endpoint')}</option>
            <option value="status">{t('api.logs.status')}</option>
            <option value="timestamp">{t('api.logs.timestamp')}</option>
            <option value="responseTime">{t('api.logs.response_time')}</option>
          </select>
          {filterColumn !== 'all' && (
            <input type="text" placeholder={`${t('api.logs.filter_by')} ${t('api.logs.' + filterColumn) || filterColumn}...`} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="bg-[#0E1A3D] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300 placeholder-gray-500" />
          )}
          {(filterColumn !== 'all' || filterValue !== '') && (
            <button onClick={() => { setFilterColumn('all'); setFilterValue(''); }} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">{t('api.logs.clear')}</button>
          )}
        </div>
        <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">{t('api.logs.analyze')}</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-[#3B5B75]">
              <th className="text-left py-2">{t('api.logs.timestamp')}</th>
              <th className="text-left py-2">{t('api.logs.method')}</th>
              <th className="text-left py-2">{t('api.logs.endpoint')}</th>
              <th className="text-left py-2">{t('api.logs.status')}</th>
              <th className="text-left py-2">{t('api.logs.response_time')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, i) => (
              <tr key={i} className="border-b border-[#3B5B75] hover:bg-[#0E1A3D]/50 transition-colors">
                <td className="py-2 text-gray-300">{log.timestamp}</td>
                <td className="py-2"><span className={`px-2 py-1 rounded text-xs text-white ${getMethodColor(log.method)}`}>{log.method}</span></td>
                <td className="py-2 text-gray-300 font-mono">{log.endpoint}</td>
                <td className={`py-2 ${getStatusColor(log.status)}`}>{log.status}</td>
                <td className="py-2 text-gray-300">{log.responseTime}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr><td colSpan="5" className="py-4 text-center text-gray-500">{t('api.logs.no_results')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
