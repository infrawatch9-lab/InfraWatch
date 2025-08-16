import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

// componentes internos
import HeaderActions from "./dashboards_components/ServerHeaderActions";
import ResponseErrorsCard from "./dashboards_components/ServerResponseErrorsCard";
import StatusCodesCard from "./dashboards_components/ServerStatusCodesCard";
import HttpMethodsCard from "./dashboards_components/ServerHttpMethodsCard";
import InteractiveTerminal from "./dashboards_components/ServerInteractiveTerminal";

export default function ServerDashboard() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState("Week");
  const [chartType, setChartType] = useState("line"); // 'line' | 'area' | 'bar'
  const [data, setData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [methodData, setMethodData] = useState([]);

  // Simulated data - replace with real API calls
  useEffect(() => {
    // Main chart data
    const chartData = [
      { x: "X0", response: 4.5, error: 1.2 },
      { x: "X1", response: 14.2, error: 1.8 },
      { x: "X2", response: 3.8, error: 1.5 },
      { x: "X3", response: 24.1, error: 1.9 },
      { x: "X4", response: 3.9, error: 1.4 },
      { x: "X5", response: 4.5, error: 1.2 },
      { x: "X6", response: 14.2, error: 1.8 },
      { x: "X7", response: 3.8, error: 1.5 },
      { x: "X8", response: 24.1, error: 1.9 },
      { x: "X9", response: 3.9, error: 1.4 },
      { x: "X10", response: 4.5, error: 1.2 },
      { x: "X11", response: 14.2, error: 1.8 },
      { x: "X12", response: 3.8, error: 1.5 },
      { x: "X13", response: 24.1, error: 1.9 },
      { x: "X14", response: 3.9, error: 1.4 },
    ];

    // HTTP Status codes data
    const statusCodes = [
      { code: "500", percentage: 35, color: "#FF6B6B" },
      { code: "404", percentage: 12, color: "#4ECDC4" },
      { code: "301", percentage: 8, color: "#45B7D1" },
      { code: "300", percentage: 15, color: "#96CEB4" },
      { code: "200", percentage: 30, color: "#FFEAA7" },
    ];

    // HTTP Methods data
    const methods = [
      { method: "GET", percentage: 95, color: "#FF6B6B" },
      { method: "PUT", percentage: 3, color: "#4ECDC4" },
      { method: "POST", percentage: 12, color: "#45B7D1" },
      { method: "DELETE", percentage: 16, color: "#96CEB4" },
    ];

    setData(chartData);
    setStatusData(statusCodes);
    setMethodData(methods);
  }, [timeFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-[#081028]">
      {/* Header / ações */}
      <div className="p-6 text-white">
        <HeaderActions />
      </div>

      {/* Grid principal */}
      <div className="px-6 pb-6 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <ResponseErrorsCard
              data={data}
              chartType={chartType}
              setChartType={setChartType}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
            />
          </div>

          {/* Sidebar direita */}
          <div className="space-y-4">
            <StatusCodesCard items={statusData} />
            <HttpMethodsCard items={methodData} />
          </div>
        </div>

        {/* Terminal */}
        <InteractiveTerminal className="mt-6" />
      </div>
    </div>
  );
}
