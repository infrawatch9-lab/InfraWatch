import React from "react";

export default function HeaderActions({ onNew, onShowAll, onExplorer }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <select
          className="bg-[#010E37] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300"
          value="ALL API SERVICES"
          onChange={() => {}}
        >
          <option>ALL API SERVICES</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onNew}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          New
        </button>
        <button
          onClick={onShowAll}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          Show All
        </button>
        <button
          onClick={onExplorer}
          className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050] transition-colors"
        >
          Explorer
        </button>
      </div>
    </div>
  );
}
