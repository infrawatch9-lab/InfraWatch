import Sidebar from './SideBar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';

function LayoutContent() {
  const { isOpen } = useSidebar();

  return (
    <div className="flex">
      <Sidebar />
      <main 
        className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${
          isOpen ? 'ml-64' : 'ml-20'
        }`} 
        style={{padding: '0px', margin: '0px', marginLeft: isOpen ? '256px' : '80px'}}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
