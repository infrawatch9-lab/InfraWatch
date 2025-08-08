import { useParams, Link } from "react-router-dom";
import {
  Server,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import UptimeChart from "../components/Dashboard/UptimeChart";

export default function SystemDetails() {
  const { id } = useParams();

  // Simulando dados (normalmente viria de API ou contexto)
  const sistema = {
    id,
    nome: "ERP-PROD",
    ip: "192.168.1.10",
    tipo: "API",
    status: "UP",
    sla: "99.98%",
    porta: 443,
    protocolo: "HTTPS",
    hostname: "erp.infrawatch.com",
    historico: [
      { status: "UP", hora: "10:00" },
      { status: "UP", hora: "09:30" },
      { status: "DOWN", hora: "09:00" },
    ],
    alertas: [
      {
        msg: "Sistema fora do ar",
        hora: "09:00",
        nivel: "alto"
      },
      {
        msg: "Resposta lenta",
        hora: "Ontem às 18:40",
        nivel: "médio"
      }
    ]
  };

  return (
    <div className="pt-24 pb-10 px-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <Server className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">
          Sistema: {sistema.nome}
        </h1>
      </div>

      {/* Info principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl shadow space-y-2">
          <p><span className="font-semibold text-gray-700">IP:</span> {sistema.ip}</p>
          <p><span className="font-semibold text-gray-700">Tipo:</span> {sistema.tipo}</p>
          <p><span className="font-semibold text-gray-700">Hostname:</span> {sistema.hostname}</p>
          <p><span className="font-semibold text-gray-700">Porta:</span> {sistema.porta}</p>
          <p><span className="font-semibold text-gray-700">Protocolo:</span> {sistema.protocolo}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow space-y-2">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Status:</span>
            {sistema.status === "UP" ? (
              <span className="text-green-600 inline-flex items-center gap-1 font-semibold">
                <CheckCircle className="w-4 h-4" /> Ativo
              </span>
            ) : (
              <span className="text-red-600 inline-flex items-center gap-1 font-semibold">
                <XCircle className="w-4 h-4" /> Inativo
              </span>
            )}
          </p>
          <p><span className="font-semibold text-gray-700">SLA:</span> {sistema.sla}</p>
          <p><span className="font-semibold text-gray-700">Última verificação:</span> {sistema.historico[0].hora}</p>
        </div>
      </div>

      {/* Gráfico (placeholder) */}
      <UptimeChart />

      {/* Alertas do sistema */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Alertas Relacionados</h2>
        {sistema.alertas.length === 0 ? (
          <p className="text-gray-500">Nenhum alerta registrado.</p>
        ) : (
          <ul className="space-y-3">
            {sistema.alertas.map((a, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  a.nivel === "alto"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    a.nivel === "alto" ? "text-red-500" : "text-yellow-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.msg}</p>
                  <span className="text-xs text-gray-500">{a.hora}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Histórico de verificações */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Histórico de Verificações</h2>
        <ul className="divide-y divide-gray-200 text-sm">
          {sistema.historico.map((h, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <span className="text-gray-700">{h.hora}</span>
              <span className={`font-medium ${
                h.status === "UP" ? "text-green-600" : "text-red-600"
              }`}>{h.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Voltar */}
      <Link
        to="/systems"
        className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Sistemas
      </Link>
    </div>
  );
}
