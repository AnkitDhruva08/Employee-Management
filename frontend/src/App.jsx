import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import CompanyDashboard from './pages/CompanyDashboard';
import Role from './pages/Role'
import AddEmployee from './pages/AddEmployee';
import Login from './pages/Login';
import AdminDahsboard from './pages/AdminDashboard';
import HrDashboard from './pages/HrDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/company-dashboard" element={<CompanyDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDahsboard />} />
        <Route path="/hr-dashboard" element={<HrDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/role" element={<Role />} />
        <Route path="/employees" element={<AddEmployee />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
