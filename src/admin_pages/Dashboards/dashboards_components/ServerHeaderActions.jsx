import React from "react";
import { useTranslation } from "react-i18next";

export default function HeaderActions({ onNew, onShowAll, onExplorer }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <select
          className="bg-[#010E37] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300"
          value={t('server.all_api_services')}
          onChange={() => {}}
        >
          <option>{t('server.all_api_services')}</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onNew}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          {t('server.new')}
        </button>
        <button
          onClick={onShowAll}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          {t('server.show_all')}
        </button>
        <button
          onClick={onExplorer}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          {t('server.explorer')}
        </button>
      </div>
    </div>
  );
}
