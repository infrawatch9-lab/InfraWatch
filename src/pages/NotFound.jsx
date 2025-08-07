import { Radar } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md border border-gray-200 text-center">

        <div className="flex justify-center mb-4">
          <Radar className="h-10 w-10 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">InfraWatch</h1>

        <p className="text-gray-600 mb-6">
          Página não encontrada. O caminho que tentaste acessar não existe ou foi movido.
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300"
        >
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}
