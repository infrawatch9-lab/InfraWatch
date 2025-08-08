import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SidebarItemWithSubmenu({ icon, label, subItems, isOpen }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div
        className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <span className="text-lg">{icon}</span>
          {isOpen && <span className="text-sm">{label}</span>}
        </div>
        {isOpen && (
          isExpanded
            ? <ChevronDown size={16} />
            : <ChevronRight size={16} />
        )}
      </div>

      {/* Submenu */}
      {isOpen && isExpanded && (
        <div className="ml-8 space-y-1">
          {subItems.map((subItem, index) => (
            <div
              key={index}
              className="text-sm text-gray-300 hover:text-white cursor-pointer"
              onClick={subItem.onClick}
            >
              {subItem.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
