import React from "react";
import { useTranslation } from 'react-i18next';

export default function WebhookDashboard() {
    const { t } = useTranslation();
    return (
      <div >
        <h1 className="text-2xl font-bold">{t('dashboard.webhooks_title')}</h1>
        <p>{t('dashboard.webhooks_content')}</p>
      </div>
    );
  }
