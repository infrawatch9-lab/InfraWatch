import React, { useState } from 'react';
import { Home, Monitor, BarChart, History, Users, Settings, Moon, Power, FolderOpen } from 'lucide-react';
import CollapseButton from '../components/CollapseButton';
import { useNavigate } from 'react-router-dom';
import SidebarItemWithSubmenu from '../components/SideBarWithSubMenu'
import SidebarItem from '../components/SideBarItem';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className={`bg-[#0B1440] text-white h-screen flex flex-col justify-between transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} p-4`}>
      
      {/* Topo */}
      <div>
        <div className="flex items-center space-x-2 mb-6 novo" style={{ display: "flex", gap: 20 }}>
          {isOpen && <img src="/img/logo_white.png" alt="Logo" className="w-8 h-8" />}
          {isOpen && <h1 className="text-lg font-semibold">InfraWatch</h1>}
          <CollapseButton isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />
        </div>

        <SidebarItem icon={<Home size={20} />} label="Homepage" isOpen={isOpen} to="homepage_admin"/>
        <SidebarItemWithSubmenu icon={<Users size={20} />} label="Testes" isOpen={isOpen}
          subItems={[
            { label: 'Users', onClick: () => navigate('/users') },
            { label: 'Teams', onClick: () => navigate('/teams') },
            { label: 'Roles', onClick: () => navigate('/roles') },
          ]}
        />
        <SidebarItem icon={<Monitor size={20} />} label="Dashboard" isOpen={isOpen} to="dashboard_admin"/>
        <SidebarItem icon={<BarChart size={20} />} label="Monitoramento" badge="1" isOpen={isOpen} />
        <SidebarItem icon={<FolderOpen size={20} />} label="Relatórios" badge="1" isOpen={isOpen} />
        <SidebarItem icon={<History size={20} />} label="Histórico" isOpen={isOpen} />
        <SidebarItem icon={<Users size={20} />} label="Usuários" isOpen={isOpen} />
        <SidebarItem icon={<Settings size={20} />} label="Configurações" isOpen={isOpen} />
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
