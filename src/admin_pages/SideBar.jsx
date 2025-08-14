import React from 'react';
import { Home, Monitor, BarChart, History, Users, Settings, Moon, Power, FolderOpen } from 'lucide-react';
import CollapseButton from '../components/CollapseButton';
import { useNavigate } from 'react-router-dom';
import SidebarItemWithSubmenu from '../components/SideBarWithSubMenu'
import SidebarItem from '../components/SideBarItem';
import { useSidebar } from '../contexts/SidebarContext';

export default function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  return (
    <div className={`bg-[#0B1440] text-white fixed left-0 top-0 h-screen flex flex-col justify-between transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'} p-4 overflow-y-auto`}>
      
      {/* Topo */}
      <div>
        <div className="flex items-center space-x-2 mb-6 novo" style={{ display: "flex", gap: 20 }}>
          {isOpen && <img src="/img/logo_white.png" alt="Logo" className="w-8 h-8" />}
          {isOpen && <h1 className="text-lg font-semibold">InfraWatch</h1>}
          <CollapseButton isOpen={isOpen} toggle={toggleSidebar} />
        </div>

        <SidebarItem icon={<Home size={20} />} label="Homepage" isOpen={isOpen} to="/admin/homepage_admin"/>
        <SidebarItem icon={<BarChart size={20} />} label="Monitoramento" badge="1" isOpen={isOpen} to="/admin/monitor_admin"/>
        <SidebarItemWithSubmenu icon={<FolderOpen size={20} />} label="Relatórios" isOpen={isOpen}
          subItems={[
            { label: 'Servidores', to: "reports_servers_admin" },
            { label: 'Redes', to: "reports_networks_admin" },
            { label: 'Web hooks', to: "reports_webhooks_admin" },
            { label: 'APIs', to: "reports_api_admin" },
          ]}
        />
        <SidebarItem icon={<History size={20} />} label="Histórico" isOpen={isOpen} to="/admin/history_admin"/>
        <SidebarItem icon={<Users size={20} />} label="Usuários" isOpen={isOpen} to="/admin/users_admin"/>
        <SidebarItem icon={<Settings size={20} />} label="Configurações" isOpen={isOpen} to="/admin/settings_admin"/>
      </div>

      {/* Parte inferior */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Moon size={20} />
            {isOpen && <span>Dark Mode</span>}
          </div>
          {isOpen && (
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 relative transition-all duration-300">
                <div className="absolute left-1 top-0.5 bg-white w-4 h-4 rounded-full peer-checked:translate-x-4 transition-all"></div>
              </div>
            </label>
          )}
        </div>

        <button onClick={() => navigate('/')} className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-red-600 text-white rounded-md py-2 text-sm transition-all">
          <Power size={20} />
          {isOpen && <span>Logout</span>}
        </button>

      </div>
    </div>
  );
}
