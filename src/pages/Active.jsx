import { CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Actives() {
    const { t } = useTranslation();
    return (
        <div className="pt-24 pb-10 px-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <CheckCircle className="text-green-600 w-8 h-8" />
                <h1 className="text-2xl font-bold text-gray-800">{t('active.title')}</h1>
            </div>
            <p className="text-gray-600 mb-6">{t('active.description')}</p>
            <Link to="/systems" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                <ArrowLeft className="w-4 h-4" />
                {t('active.back')}
            </Link>
        </div>
    );
}
