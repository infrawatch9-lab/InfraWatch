import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import TopBar from "../../components/Topbar";
import ChartSection from "./dashboards_components/APIChartSection";
import StatusCard from "./dashboards_components/APIStatusCard";
import MethodsCard from "./dashboards_components/APIMethodsCard";
import LogsTable from "./dashboards_components/APILogsTable";
import HeaderActions from "./dashboards_components/APIHeaderActions";

export default function APIDashboard() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState("Week");
  const [chartType, setChartType] = useState("line");
  const [data, setData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [methodData, setMethodData] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterValue, setFilterValue] = useState("");


  // Dados mocados
  useEffect(() => {
    setData([
      { x: 'X0', response: 4.5, error: 1.2 }, 
      { x: 'X1', response: 14.2, error: 1.8 }, 
      { x: 'X2', response: 3.8, error: 1.5 }, 
      { x: 'X3', response: 24.1, error: 1.9 }, 
      { x: 'X4', response: 3.9, error: 1.4 }, 
      { x: 'X5', response: 4.5, error: 1.2 }, 
      { x: 'X6', response: 14.2, error: 1.8 }, 
      { x: 'X7', response: 3.8, error: 1.5 }, 
      { x: 'X8', response: 24.1, error: 1.9 }, 
      { x: 'X9', response: 3.9, error: 1.4 }, 
      { x: 'X10', response: 4.5, error: 1.2 }, 
      { x: 'X11', response: 14.2, error: 1.8 }, 
      { x: 'X12', response: 3.8, error: 1.5 }, 
      { x: 'X13', response: 24.1, error: 1.9 }, 
      { x: 'X14', response: 3.9, error: 1.4 }
    ]);
    setStatusData([
      { code: '500', percentage: 35, color: '#FF6B6B' }, 
      { code: '404', percentage: 12, color: '#4ECDC4' }, 
      { code: '301', percentage: 8, color: '#45B7D1' }, 
      { code: '300', percentage: 15, color: '#96CEB4' }, 
      { code: '200', percentage: 30, color: '#FFEAA7' }
    ]);
    setMethodData([
      { method: 'GET', percentage: 95, color: '#FF6B6B' }, 
      { method: 'PUT', percentage: 3, color: '#4ECDC4' }, 
      { method: 'POST', percentage: 12, color: '#45B7D1' }, 
      { method: 'DELETE', percentage: 16, color: '#96CEB4' }
    ]);
    const logs = [ 
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
      { timestamp: '2025-02-16 19:01:27', method: 'GET', endpoint: '/httpbin/delete', status: '500 ER', responseTime: '120ms' }, 
      { timestamp: '2025-02-16 19:01:27', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
      { timestamp: '2025-01-17 09:21:02', method: 'GET', endpoint: '/httpbin/delete', status: '200 OK', responseTime: '120ms' }, 
    ];
    setApiLogs(logs);
    setFilteredLogs(logs);
  }, [timeFilter]);

  useEffect(() => {
    if (filterColumn === "all" || filterValue === "") {
      setFilteredLogs(apiLogs);
    } else {
      setFilteredLogs(apiLogs.filter(log => log[filterColumn]?.toLowerCase().includes(filterValue.toLowerCase())));
    }
  }, [apiLogs, filterColumn, filterValue]);

  const getStatusColor = (status) => {
    if (status.includes("200")) return "text-green-400";
    if (status.includes("500")) return "text-red-400";
    if (status.includes("404")) return "text-yellow-400";
    return "text-blue-400";
  };
  const getMethodColor = (method) => {
    switch (method) {
      case "GET": return "bg-green-600";
      case "POST": return "bg-blue-600";
      case "PUT": return "bg-yellow-600";
      case "DELETE": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#081028]">
      <TopBar />
      <div className="p-6 text-white">
        <HeaderActions />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSection data={data} chartType={chartType} setChartType={setChartType} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
          <div className="space-y-4">
            <StatusCard statusData={statusData} />
            <MethodsCard methodData={methodData} />
          </div>
        </div>
        <LogsTable filteredLogs={filteredLogs} filterColumn={filterColumn} setFilterColumn={setFilterColumn} filterValue={filterValue} setFilterValue={setFilterValue} getStatusColor={getStatusColor} getMethodColor={getMethodColor} />
      </div>
    </div>
  );
}
