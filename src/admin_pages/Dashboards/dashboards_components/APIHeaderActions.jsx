import React from "react";
import { useTranslation } from "react-i18next";

export default function HeaderActions() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <select className="bg-[#010E37] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300" value={t('api.all_api_services')} onChange={() => {}}>
          <option>{t('api.all_api_services')}</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050]">{t('api.new')}</button>
        <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050]">{t('api.show_all')}</button>
        <button className="px-3 py-1 bg-[#010E37] text-gray-300 rounded text-sm hover:bg-[#162050]">{t('api.explorer')}</button>
      </div>
    </div>
  );
}
