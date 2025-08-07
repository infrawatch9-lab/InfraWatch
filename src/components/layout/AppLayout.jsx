import { Outlet } from "react-router-dom";
import SideNav from "../SideNav";

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SideNav />

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
