import Sidebar from './SideBar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  let SideBarComponent = <Sidebar />;

  return (
    <div className="flex">
      {SideBarComponent}
      <main className="flex-1 p-6 bg-gray-100 min-h-screen" style={{padding: '0px', margin: '0px'}}>
        <Outlet />
      </main>
    </div>
  );
}
