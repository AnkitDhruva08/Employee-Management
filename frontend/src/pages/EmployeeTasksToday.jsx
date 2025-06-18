import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import CompanyLogo from "../components/CompanyLogo";
import {
  fetchDashboardLink,
  fetchDashboard,
  fecthTasks,
  loadTaskTags,
  fetchEmployees,
} from "../utils/api";

const statusColors = {
  9: "bg-red-500 text-white",      // Open
  10: "bg-orange-400 text-white",  // In Progress
  11: "bg-green-500 text-white",   // Done
  12: "bg-red-700 text-white",     // Blocked
};

const monthOptions = [
  { value: "", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const getStatusLabel = (statusId) => {
  switch (statusId) {
    case 9: return "Open";
    case 10: return "In Progress";
    case 11: return "Done";
    case 12: return "Blocked";
    default: return "Unknown";
  }
};

const EmployeeTasksToday = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [taskTags, setTaskTags] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter States
  const [filterTagId, setFilterTagId] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const dashboardLinks = await fetchDashboardLink(token);
      const dashboard = await fetchDashboard(token);
      const tags = await loadTaskTags(token);
      const allEmployees = await fetchEmployees(token);
      const tasks = await fecthTasks(token, filterTagId, filterEmployeeId, filterStartDate, filterEndDate, filterMonth);

      setQuickLinks(dashboardLinks);
      setDashboardData(dashboard);
      setTaskTags(tags);
      setEmployees(allEmployees);
      setTaskData(tasks);
    } catch (err) {
      console.error("Error:", err);
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [filterTagId, filterEmployeeId, filterStartDate, filterEndDate, filterMonth]);

  const clearFilters = () => {
    setFilterTagId("");
    setFilterEmployeeId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterMonth("");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-4">
        {dashboardData && (
          <CompanyLogo companyName={dashboardData.company} logoPath={dashboardData.company_logo} />
        )}
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title="Employee Task Overview" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filter UI */}
          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Filter Tasks
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Stage/Tag</label>
                <select
                  value={filterTagId}
                  onChange={(e) => setFilterTagId(e.target.value)}
                  className="p-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Stages/Tags</option>
                  {taskTags.map(({ id, name }) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              {(roleId === 1 || roleId === 2 || isCompany) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    value={filterEmployeeId}
                    onChange={(e) => setFilterEmployeeId(e.target.value)}
                    className="p-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Employees</option>
                    {employees.map(({ id, username }) => (
                      <option key={id} value={id}>{username}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="p-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="p-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="p-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-center mt-4">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:from-red-600 hover:to-red-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Task Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Employee</th>
                  <th className="py-3 px-6 text-left">Project</th>
                  <th className="py-3 px-6 text-left">Task</th>
                  <th className="py-3 px-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {taskData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-400">
                      No tasks assigned for selected filters.
                    </td>
                  </tr>
                )}
                {taskData.map((task) => (
                  <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 flex items-center">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">
                        {task.team_lead_name?.split(" ").map(word => word[0]).join("")}
                      </div>
                      {task.team_lead_name || "-"}
                    </td>
                    <td className="py-3 px-6">{task.project_name || "-"}</td>
                    <td className="py-3 px-6">{task.task_name}</td>
                    <td className="py-3 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || "bg-gray-300 text-black"}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeTasksToday;
