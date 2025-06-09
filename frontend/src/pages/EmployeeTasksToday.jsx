import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjects,
  fetchEmployees,
  fetchBugsReports,
  fetchProjectSidebar,
} from "../utils/api";

import CompanyLogo from "../components/CompanyLogo";

const statusColors = {
  Open: "bg-red-500 text-white",
  "In Progress": "bg-orange-400 text-white",
  Done: "bg-green-500 text-white",
  Blocked: "bg-red-700 text-white",
};

const tasksToday = [
  {
    id: 1,
    employee: "John Smith",
    initials: "JS",
    project: "Mobile App",
    task: "Fix login bug",
    status: "In Progress",
  },
  {
    id: 2,
    employee: "Alice Brown",
    initials: "AB",
    project: "Website Redesign",
    task: "Create wireframes",
    status: "Done",
  },
  {
    id: 3,
    employee: "Mark Wilson",
    initials: "MW",
    project: "API Development",
    task: "Code review & deploy",
    status: "Done",
  },
  {
    id: 4,
    employee: "Lisa Stern",
    initials: "LS",
    project: "Mobile App",
    task: "Write test cases",
    status: "Open",
  },
  {
    id: 5,
    employee: "David Tan",
    initials: "DT",
    project: "Website Redesign",
    task: "Implement responsive header",
    status: "In Progress",
  },
];

const EmployeeTasksToday = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [quickLinks, setQuickLinks] = useState([]);
  const fetchData = async () => {
    try {
      const dashboardLinks = await fetchDashboardLink(token);
      setQuickLinks(dashboardLinks);
      const dashboard = await fetchDashboard(token);
      setDashboardData(dashboard);
    } catch (err) {
      console.error("Error:", err);
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  const fetchEmployeeTaskDetails = async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/api/tracking-employee-task/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("data ==<<<>>", data);
    } catch (err) {
      console.error("err ===<<<>>", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    fetchEmployeeTaskDetails();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && (
          <CompanyLogo
            companyName={dashboardData.company}
            logoPath={dashboardData.company_logo}
          />
        )}
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title="Employee Task Today" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Employee
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Project
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Task
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tasksToday.map(
                ({ id, employee, initials, project, task, status }) => (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 flex items-center gap-3">
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold select-none"
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                      {employee}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {project}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{task}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold ${
                          statusColors[status] || "bg-gray-300 text-black"
                        }`}
                        aria-label={`Status: ${status}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default EmployeeTasksToday;
