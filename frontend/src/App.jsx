import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Role from './pages/Role'
import AddEmployee from './pages/AddEmployee';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BankDetails from './pages/BankDetails';
import NomineeDetails from './pages/Nominee';
import EmployeeDocuments from './pages/EmployeeDocuments';
import EmergencyContact from './pages/EmergencyContact';
import OfficeDetails from './pages/OfficeDetails';
import Leave from './pages/Leave';
import EmployeeTable from './pages/EmployeeTable';
import LeaveTable from './pages/LeaveTable';
import Attendance from './pages/AttendenceDashboard';
import HoliDays from './pages/HoliDays';
import Profile from './pages/EmployeeProfile';
import EmployeeForm from './components/form/EmployeeForm';
import ProfilePage from './components/user/ProfilePage';
import UserProfileCard from './components/user/ProfilePage1';
import ProfileDropdown from './components/user/ProfileDropdown';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employee-dashboard/:id" element={<Dashboard />} />
        <Route path="/employees/:id" element={<Dashboard />} />
        <Route path="/role" element={<Role />} />
        <Route path="/add-employees" element={<AddEmployee />} />
        <Route path="/add-employees/:id" element={<AddEmployee />} />
        <Route path="/bank-details" element={<BankDetails />} />
        <Route path="/bank-details/:id" element={<BankDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/nominees-details" element={<NomineeDetails />} />
        <Route path="/employee-documents" element={<EmployeeDocuments />} />
        <Route path="/employee-emeregency-contact" element={<EmergencyContact />} />
        <Route path="/employee-office-details" element={<OfficeDetails />} />
        <Route path="/leave-details" element={<Leave />} />
        <Route path="/employee-details" element={<EmployeeTable />} />
        <Route path="/leave-table" element={<LeaveTable />} />
        <Route path="/attendance-module" element={<Attendance />} />
        <Route path="/holidays" element={<HoliDays />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/employee-form" element={<EmployeeForm />} />
        <Route path="/profile-page" element={<ProfilePage />} />
        <Route path="/user-profile-card" element={<UserProfileCard />} />
        <Route path="/profile-dropdown" element={<ProfileDropdown />} />

      </Routes>
    </Router>
  );
}

export default App;
