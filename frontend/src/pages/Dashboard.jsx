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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

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

  useEffect(() => {
    fetchLinks();
  }, []);

  if (error) {
    return <div className="text-red-600 text-center mt-10 text-xl animate-pulse">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading dashboard...</div>;
  }

  const superUserCards = isSuperUser
    ? dashboardData.companies?.map((company) => ({
        id: company.company_id,
        label: company.company_name,
        value: company.team_size,
        icon: <FaIcons.FaBuilding className="text-4xl text-yellow-500" />,
        url: "#",
      }))
    : [];

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

  const lineChartData = {
    labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"],
    datasets: [
      {
        label: "USA",
        data: [20, 35, 25, 40, 50, 55, 45, 60],
        borderColor: "#7366ff",
        backgroundColor: "transparent",
      },
      {
        label: "UK",
        data: [10, 25, 35, 30, 40, 35, 30, 45],
        borderColor: "#f73164",
        backgroundColor: "transparent",
      },
    ],
  };

  const doughnutData = {
    labels: ["Search Engines", "Direct Click", "Bookmarks Click"],
    datasets: [
      {
        data: [30, 30, 40],
        backgroundColor: ["#5e72e4", "#2dce89", "#fb6340"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData.company}</h2>
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="p-6 overflow-y-auto flex-1">
          {(isSuperUser || isCompany || roleId === 1 || roleId === 2) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map(({ id, label, value, icon, url, color }) => (
                <Link
                  key={id}
                  to={url || "#"}
                  className={`bg-gradient-to-r ${color} rounded-2xl shadow-md p-6 flex items-center justify-between text-white hover:scale-105 transform transition`}
                >
                  <div>
                    <h4 className="text-lg font-medium">{label}</h4>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div>{icon}</div>
                </Link>
              ))}
            </div>
          )}

          {/* Charts */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10"> */}
            {/* Line Chart */}
            {/* <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Visit and Sales Statistics</h3>
              <Line data={lineChartData} />
            </div> */}

            {/* Doughnut Chart */}
            {/* <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Traffic Sources</h3>
              <Doughnut data={doughnutData} />
            </div> */}
          {/* </div> */}
          
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
