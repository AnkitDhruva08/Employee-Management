import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// ChartJS setup
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";
  console.log('roleId ==<<>>', roleId)

  const baseUrl = "http://localhost:8000";

  const HeaderTitle = isSuperUser
    ? "Superuser Dashboard"
    : isCompany
    ? "Company Dashboard"
    : roleId === 3
    ? "Employee Dashboard"
    : roleId === 2
    ? "HR Dashboard"
    : roleId === 1
    ? "Admin Dashboard"
    : "Dashboard";

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        if (!isSuperUser) {
          const links = await fetchDashboardLink(token);
          setQuickLinks(links.data || links);
        }
        const empDashboard = await fetchDashboard(token);
        setDashboardData(empDashboard);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        navigate("/login");
      }
    };

    fetchLinks();
  }, []);

  if (error) {
    return (
      <div className="text-red-600 text-center mt-10 text-xl animate-pulse">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  // Colors
  const superUserColors = [
    "from-yellow-400 to-red-500",
    "from-green-400 to-blue-500",
    "from-pink-400 to-purple-600",
    "from-indigo-400 to-teal-500",
    "from-red-400 to-pink-600",
    "from-purple-400 to-indigo-600",
  ];

  const getColorByIndex = (index) => {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  // SuperUser Cards
  const superUserCards =
    isSuperUser && Array.isArray(dashboardData?.companies)
      ? dashboardData.companies.map((company, index) => ({
          id: company.company_id,
          label: company.company_name,
          value: company.team_size,
          email: company.company_email,
          contact: company.contact_number,
          logo: company.company_logo
            ? `${baseUrl}${company.company_logo}`
            : null,
          color: getColorByIndex(index),
        }))
      : [];

  // Regular role cards
  const statCards = !isSuperUser
    ? [
        {
          id: "total-employees",
          label: "Total Employees",
          value: dashboardData.total_employees,
          icon: <FaIcons.FaUsers className="text-white text-3xl" />,
          color: "from-blue-500 to-blue-700",
          url: "/employee-details",
        },
        {
          id: "total-leave",
          label: "Leave Requests",
          value: dashboardData.total_leave_requests,
          icon: <FaIcons.FaClipboardList className="text-white text-3xl" />,
          color: "from-green-400 to-green-600",
          url: "/leave-table",
        },
        {
          id: "upcoming-events",
          label: "Upcoming Events",
          value: dashboardData.upcoming_events,
          icon: <FaIcons.FaCalendarAlt className="text-white text-3xl" />,
          color: "from-purple-500 to-purple-700",
          url: "/events",
        },
        {
          id: "total-project",
          label: "Total Projects",
          value: dashboardData.total_projects,
          icon: <FaIcons.FaProjectDiagram className="text-white text-3xl" />,
          color: "from-indigo-500 to-indigo-700",
          url: "/employee-details",
        },
        {
          id: "total-task",
          label: "Total Tasks",
          value: dashboardData.total_tasks,
          icon: <FaIcons.FaTasks className="text-white text-3xl" />,
          color: "from-pink-500 to-pink-700",
          url: "/tasks",
        },
        {
          id: "departments",
          label: "Departments",
          value: dashboardData.departments,
          icon: <FaIcons.FaSitemap className="text-white text-3xl" />,
          color: "from-teal-500 to-teal-700",
          url: "/departments",
        },
      ]
    : superUserCards;

  return (
    <div className="flex h-screen bg-gray-100">
      {!isSuperUser && (
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            {dashboardData.company}
          </h2>
          <Sidebar quickLinks={quickLinks} />
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="p-6 overflow-y-auto flex-1">
          {(isSuperUser || isCompany || roleId === 1 || roleId === 2) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map(
                (
                  { id, label, value, icon, email, contact, logo, color, url },
                  index
                ) =>
                  isSuperUser ? (
                    <div
                      key={id}
                      style={{
                        background: `linear-gradient(135deg, ${getColorByIndex(
                          index
                        )} 0%, ${getColorByIndex(index + 1)} 100%)`,
                      }}
                      className="rounded-3xl p-6 shadow-lg text-white flex flex-col justify-between hover:scale-[1.03] transition-all"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-1">{label}</h2>
                          <p className="text-sm opacity-80">{email}</p>
                          <p className="text-sm opacity-80">{contact}</p>
                        </div>
                        {logo && (
                          <img
                            src={logo}
                            alt={`${label} Logo`}
                            className="w-28 h-28 object-contain rounded-full bg-white p-1 shadow"
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xl font-semibold">
                          Team Size: {value}
                        </span>
                        {icon}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={id}
                      to={url}
                      className={`bg-gradient-to-r ${color} rounded-2xl shadow-md p-6 text-white flex flex-col justify-between hover:scale-105 transform transition`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium">{label}</h4>
                        {logo && (
                          <img
                            src={logo}
                            alt={`${label} Logo`}
                            className="w-12 h-12 object-contain rounded-full bg-white p-1 shadow"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold">{value}</p>
                        {icon}
                      </div>
                    </Link>
                  )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
