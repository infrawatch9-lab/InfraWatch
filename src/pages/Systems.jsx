import { useState } from "react";
import {
  Server,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Search,
  PlusCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const sistemasFake = [
  {
    id: "erp-prod",
    nome: "ERP-PROD",
    tipo: "API",
    ip: "192.168.1.10",
    status: "UP",
    ultimaVerificacao: "10:23 - Hoje",
    sla: "99.98%",
  },
  {
    id: "self-service",
    nome: "Self-Service",
    tipo: "Frontend",
    ip: "192.168.1.11",
    status: "DOWN",
    ultimaVerificacao: "10:15 - Hoje",
    sla: "97.12%",
  },
  {
    id: "db-clientes",
    nome: "Base de Dados - Clientes",
    tipo: "Banco de Dados",
    ip: "192.168.1.12",
    status: "UP",
    ultimaVerificacao: "10:30 - Hoje",
    sla: "99.90%",
  }
];

export default function Systems() {
  const [busca, setBusca] = useState("");

  const sistemasFiltrados = sistemasFake.filter((s) =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="pt-24 pb-10 px-6 max-w-7xl mx-auto">

      <div className="flex items-center gap-3 mb-6">
        <Server className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">Sistemas Monitorados</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar sistema..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg transition">
          <PlusCircle className="w-5 h-5" />
          Adicionar Sistema
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Nome</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">IP</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Última Verificação</th>
              <th className="px-6 py-3 text-left">SLA</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sistemasFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Nenhum sistema encontrado.</td>
              </tr>
            ) : (
              sistemasFiltrados.map((sistema) => (
                <tr key={sistema.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-700 hover:underline cursor-pointer">
                    <Link to={`/sistemas/${sistema.id}`}>
                      {sistema.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {sistema.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sistema.ip}</td>
                  <td className="px-6 py-4">
                    {sistema.status === "UP" ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        <XCircle className="w-4 h-4" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sistema.ultimaVerificacao}</td>
                  <td className="px-6 py-4 text-gray-800">{sistema.sla}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="text-blue-600 hover:underline font-medium">Editar</button>
                    <button className="text-red-600 hover:underline font-medium">Remover</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
