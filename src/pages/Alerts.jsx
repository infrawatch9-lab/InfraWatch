import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Alerts() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="text-red-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">Histórico de Alertas</h1>
      </div>
      <p className="text-gray-600 mb-6">Aqui você encontrará todos os alertas registrados no sistema, ordenados por data ou severidade.</p>

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
