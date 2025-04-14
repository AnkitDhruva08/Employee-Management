import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Role from './pages/Role'
import AddEmployee from './pages/Employee';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/company-dashboard" element={<Dashboard />} />
        <Route path="/role" element={<Role />} />
        <Route path="/employees" element={<AddEmployee />} />
      </Routes>
    </Router>
  );
}

export default App;
