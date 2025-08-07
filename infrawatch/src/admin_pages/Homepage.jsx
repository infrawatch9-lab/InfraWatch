import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/SideBar'

export function HomepageAdmin() {
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
     <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-6">
        {/* Botão para abrir/fechar menu */}
        <button
          className="text-2xl mb-4 text-[#080F2A] hover:text-[#0a1c47] focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
        </button>

        <h2 className="text-2xl font-semibold mb-4">Página Inicial</h2>
        <p>Bem-vindo ao painel da InfraWatch.</p>
      </div>
    </div>
  );
}
