import { FileBarChart2, Clock3, ServerCrash, CalendarDays } from "lucide-react";

export default function Reports() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FileBarChart2 className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">Relatórios de SLA</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <label className="text-sm text-gray-700 font-medium">
          Período:
          <select className="ml-2 py-1 px-2 rounded border border-gray-300">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Mês atual</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3">Serviço</th>
              <th className="px-6 py-3 flex items-center gap-1">
                <Clock3 className="w-4 h-4" /> SLA (%)
              </th>
              <th className="px-6 py-3 flex items-center gap-1">
                <ServerCrash className="w-4 h-4" /> Falhas
              </th>
              <th className="px-6 py-3 flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> Última queda
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-800">ERP-PROD</td>
              <td className="px-6 py-4 text-green-600 font-semibold">99.1%</td>
              <td className="px-6 py-4">2</td>
              <td className="px-6 py-4 text-gray-500">04/08/2025 10:23</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-800">Kiosks Self-Service</td>
              <td className="px-6 py-4 text-yellow-500 font-semibold">98.7%</td>
              <td className="px-6 py-4">3</td>
              <td className="px-6 py-4 text-gray-500">02/08/2025 18:01</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-800">E-mail Corporativo</td>
              <td className="px-6 py-4 text-green-600 font-semibold">100%</td>
              <td className="px-6 py-4">0</td>
              <td className="px-6 py-4 text-gray-500">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
