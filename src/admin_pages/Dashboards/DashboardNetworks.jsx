import React from "react";
import { useTranslation } from 'react-i18next';

export default function NetworkDashboard() {
    const { t } = useTranslation();
    return (
      <div >
        <h1 className="text-2xl font-bold">{t('dashboard.networks_title')}</h1>
        <p>{t('dashboard.networks_content')}</p>
      </div>
    );
  }
