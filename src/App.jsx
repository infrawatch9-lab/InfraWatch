import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/Login';
import { HomepageAdmin } from './admin_pages/Homepage';
import Layout from './admin_pages/Layout';
import DashboardAdmin from './admin_pages/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Layout/>}>
          <Route index element={<HomepageAdmin />}/>
          <Route path="homepage_admin" element={<HomepageAdmin />}/>
          <Route path="dashboard_admin" element={<DashboardAdmin />}/>
        </Route>
      </Routes>
    </Router>
  );
}
