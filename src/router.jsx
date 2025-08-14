
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
import APIDashboard from './admin_pages/Dashboards/DashboardAPI';
import NetworkDashboard from './admin_pages/Dashboards/DashboardNetworks';
import ServerDashboard from './admin_pages/Dashboards/DashboardServers';
import WebhookDashboard from './admin_pages/Dashboards/DashboardWebhooks';
import ServersReport from "./admin_pages/Relatorio_pages/Servers";
import NetworksReport from "./admin_pages/Relatorio_pages/Networks";
import APIReport from "./admin_pages/Relatorio_pages/API";
import WebhooksReport from "./admin_pages/Relatorio_pages/Webhooks";

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
            <Route path="reports_servers_admin" element={<ServersReport />}/>
            <Route path="reports_networks_admin" element={<NetworksReport />}/>
            <Route path="reports_api_admin" element={<APIReport />}/>
            <Route path="reports_webhooks_admin" element={<WebhooksReport />}/>
            <Route path="monitor_admin" element={<MonitorAdmin />}/>
            <Route path="history_admin" element={<HistoryAdmin />}/>
            <Route path="users_admin" element={<UsersAdmin />}/>
            <Route path="settings_admin" element={<SettingsAdmin />}/>
            <Route path="dashboard_api_admin" element={<APIDashboard />}/>
            <Route path="dashboard_servers_admin" element={<ServerDashboard />}/>
            <Route path="dashboard_networks_admin" element={<NetworkDashboard />}/>
            <Route path="dashboard_webhooks_admin" element={<WebhookDashboard />}/>
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
