import { Link } from "react-router-dom";
import UptimeChart from "../components/Dashboard/UptimeChart";
import {
  Server,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Radar
} from "lucide-react";

export default function Dashboard() {
  return (
    <>
    <div className="pt-24 pb-10 px-6 max-w-7xl mx-auto">

      <div className="flex items-center gap-3 mb-8">
        <Radar className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        <Link to="/systems" className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition group">
          <Server className="w-10 h-10 text-blue-600 group-hover:scale-110 transition" />
          <div>
            <p className="text-sm text-gray-500">Sistemas Monitorados</p>
            <h2 className="text-xl font-bold text-gray-800">12</h2>
          </div>
        </Link>

        <Link to="/active" className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition group">
          <CheckCircle className="w-10 h-10 text-green-600 group-hover:scale-110 transition" />
          <div>
            <p className="text-sm text-gray-500">Ativos (UP)</p>
            <h2 className="text-xl font-bold text-gray-800">10</h2>
          </div>
        </Link>

        <Link to="/inactive" className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition group">
          <XCircle className="w-10 h-10 text-red-600 group-hover:scale-110 transition" />
          <div>
            <p className="text-sm text-gray-500">Inativos (DOWN)</p>
            <h2 className="text-xl font-bold text-gray-800">2</h2>
          </div>
        </Link>

        <Link to="/sla" className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition group">
          <Clock className="w-10 h-10 text-yellow-500 group-hover:scale-110 transition" />
          <div>
            <p className="text-sm text-gray-500">SLA Médio</p>
            <h2 className="text-xl font-bold text-gray-800">99.3%</h2>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-red-600" />
          <h3 className="text-lg font-semibold text-gray-800">Alertas Recentes</h3>
        </div>

        <ul className="space-y-3">
          <Link
            to="/alerts"
            className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200 hover:bg-red-100 transition"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                ERP-PROD caiu às 10:23 (há 3 minutos)
              </p>
              <span className="text-xs text-gray-500">Notificação enviada por e-mail</span>
            </div>
            <XCircle className="text-red-500 w-5 h-5" />
          </Link>

          <Link
            to="/alerts"
            className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                Uptime do Self-Service abaixo de 99%
              </p>
              <span className="text-xs text-gray-500">Últimos 30 dias</span>
            </div>
            <AlertTriangle className="text-yellow-500 w-5 h-5" />
          </Link>
        </ul>
      </div>

      <UptimeChart />
    </div>
    </>
  );
}
