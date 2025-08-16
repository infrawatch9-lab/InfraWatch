import React from "react";
import { useTranslation } from 'react-i18next';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const getStatusConfig = (status) => {
    switch (status) {
      case t('status_badge.error'):
        return { bg: 'bg-red-500', text: 'text-white', dot: 'bg-red-500' };
      case t('status_badge.at_risk'):
        return { bg: 'bg-yellow-500', text: 'text-white', dot: 'bg-yellow-500' };
      case t('status_badge.fulfilled'):
        return { bg: 'bg-green-500', text: 'text-white', dot: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white', dot: 'bg-gray-500' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    </div>
  );
}
