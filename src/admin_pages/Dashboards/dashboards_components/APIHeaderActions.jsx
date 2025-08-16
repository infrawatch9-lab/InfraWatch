import React from "react";

export default function HeaderActions() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <select className="bg-[#010E37] border border-[#3B5B75] rounded px-3 py-1 text-sm text-gray-300" value="ALL API SERVICES" onChange={() => {}}>
          <option>ALL API SERVICES</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050]">New</button>
        <button className="px-3 py-1 bg-[#0B1440] text-gray-300 rounded text-sm hover:bg-[#162050]">Show All</button>
        <button className="px-3 py-1 bg-[#010E37] text-gray-300 rounded text-sm hover:bg-[#162050]">Explorer</button>
      </div>
    </div>
  );
}
