import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/Login';
import { HomepageAdmin } from './admin_pages/Homepage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/homepage_admin" element={<HomepageAdmin />} />
      </Routes>
    </Router>
  );
}
