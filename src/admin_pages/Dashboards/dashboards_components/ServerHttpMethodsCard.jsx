import React from "react";

export default function HttpMethodsCard({ items = [] }) {
  return (
    <div className="bg-[#0B1440] p-6 rounded-lg shadow-lg border border-[#3B5B75]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white">HTTP Methods</h3>
        <span className="text-xs text-blue-400">últimos 24h</span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.method} className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono text-gray-300">{item.method}</span>
              <div className="w-24 h-2 bg-[#3B5B75] rounded">
                <div
                  className="h-2 rounded"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-300">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
