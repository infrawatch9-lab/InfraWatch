import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Inactive() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <XCircle className="text-red-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">Sistemas Inativos (DOWN)</h1>
      </div>
      <p className="text-gray-600 mb-6">Abaixo estão os sistemas que estão fora do ar ou com problemas detectados.</p>

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
