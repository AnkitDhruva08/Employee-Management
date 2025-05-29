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
import UserProfilePage from './components/user/UserProfileCard';
import ProfileDropdown from './components/user/ProfileDropdown';
import Projects from './pages/Projects';
import Events from './pages/Events';
import EmplyeeViews from './pages/EmplyeeViews';
import BugTracker from './pages/Bug-Tracker';
import TaskDahboard from './pages/TaskDashboard';
import EmployeeTasksToday from './pages/EmployeeTasksToday';
import ProjectCreationModal from './components/modal/ProjectCreationModal';
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
        <Route path="/employee-form/:id" element={<EmployeeForm />} />
        <Route path="/profile-page" element={<UserProfilePage />} />
        <Route path="/employee-views/:id" element={<EmplyeeViews />} />
        <Route path="/profile-dropdown" element={<ProfileDropdown />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/events" element={<Events />} />
        <Route path="/bugs" element={<BugTracker />} />
        <Route path="/employee-task-today" element={<EmployeeTasksToday />} />
        <Route path="/task-dashboard" element={<TaskDahboard />} />
        <Route path="/project-modal" element={<ProjectCreationModal />} />

      </Routes>
    </Router>
  );
}

export default App;
