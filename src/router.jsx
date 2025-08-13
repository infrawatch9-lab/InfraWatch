import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Layout from "./admin_pages/Layout";
import { HomepageAdmin } from './admin_pages/Homepage';
//import DashboardAdmin from './admin_pages/Dashboard';
import { AuthProvider } from "./components/AuthContext";
import MonitorAdmin from './admin_pages/Monitor';
import HistoryAdmin from './admin_pages/History';
import UsersAdmin from './admin_pages/Users';
import SettingsAdmin from './admin_pages/Settings';
import ServersAdmin from './admin_pages/Relatorio_pages/Servers';
import NetworksAdmin from './admin_pages/Relatorio_pages/Networks';
import RolesAdmin from './admin_pages/Relatorio_pages/Roles';
import DashboardAPI from './admin_pages/Dashboards/DashboardAPI';

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Página inicial = Login */}
          <Route path="/" element={<Login />} />

          {/* Páginas protegidas */}
          <Route
            path="/admin"
            element={
                <Layout />
            }
          >
            <Route index element={<HomepageAdmin />}/>
            <Route path="homepage_admin" element={<HomepageAdmin />}/>
            <Route path="servers_admin" element={<ServersAdmin />}/>
            <Route path="networks_admin" element={<NetworksAdmin />}/>
            <Route path="roles" element={<RolesAdmin />}/>
            <Route path="monitor_admin" element={<MonitorAdmin />}/>
            <Route path="history_admin" element={<HistoryAdmin />}/>
            <Route path="users_admin" element={<UsersAdmin />}/>
            <Route path="settings_admin" element={<SettingsAdmin />}/>
            <Route path="dashboard_api" element={<DashboardAPI />}/>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


/*

<Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="systems" element={<Systems />} />
            <Route path="active" element={<Active />} />
            <Route path="inactive" element={<Inactive />} />
            <Route path="sla" element={<SLA />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="/sistemas/:id" element={<SystemDetails />} />
            <Route path="*" element={<NotFound />} />

            */


/*

          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />

*/