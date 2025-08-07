import React from "react";
import { useNavigate } from 'react-router-dom';

export default function SidebarItem({ icon, label, isOpen, to }) {
    const navigate = useNavigate();
  
    return (
      <div
        onClick={() => navigate(to)}
        className="flex items-center space-x-4 p-2 hover:bg-[#2d2d2d] rounded cursor-pointer transition-all"
      >
        <span className="text-lg">{icon}</span>
        {isOpen && <span className="text-sm">{label}</span>}
      </div>
    );
  }
  