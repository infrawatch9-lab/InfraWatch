import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Layout from "./admin_pages/Layout";
import { HomepageAdmin } from './admin_pages/Homepage';
import DashboardAdmin from './admin_pages/Dashboard';
import { AuthProvider } from "./components/AuthContext";

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
            <Route path="dashboard_admin" element={<DashboardAdmin />}/>
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