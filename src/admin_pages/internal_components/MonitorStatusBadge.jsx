import React from "react";

export default function StatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Erro':
        return { bg: 'bg-red-500', text: 'text-white', dot: 'bg-red-500' };
      case 'Em risco':
        return { bg: 'bg-yellow-500', text: 'text-white', dot: 'bg-yellow-500' };
      case 'Cumprido':
        return { bg: 'bg-green-500', text: 'text-white', dot: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white', dot: 'bg-gray-500' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    </div>
  );
}
