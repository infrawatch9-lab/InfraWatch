import { Radar } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-blue-800 text-gray-100 text-sm w-full px-6 py-8 mt-auto">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-3 mb-6">
          <Radar className="w-8 h-8 text-white" />
          <span className="text-xl font-bold capitalize text-white">InfraWatch</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
          <span className="text-sm text-gray-200">
            &copy; {new Date().getFullYear()} InfraWatch. Todos os direitos reservados.
          </span>

          <div className="flex flex-wrap justify-center sm:justify-end gap-6">
            <Link to="/privacy" className="hover:text-blue-300 font-medium transition">
              Política de Privacidade
            </Link>
            <Link to="/terms" className="hover:text-blue-300 font-medium transition">
              Termos de Uso
            </Link>
            <Link to="/contact" className="hover:text-blue-300 font-medium transition">
              Contato
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
