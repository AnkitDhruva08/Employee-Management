import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";

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

  // Determine dashboard title based on user role
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

  // Fetch dashboard and quick links

  const fetchLinks = async () => {
    try {
     if(! isSuperUser){
      const links = await fetchDashboardLink(token);
       setQuickLinks(links.data || links);
     }
      const empDashboard = await fetchDashboard(token);
     
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching quick links:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
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

  // Define stat cards for company and HR
  const superUserCards = isSuperUser
  ? dashboardData.companies?.map((company) => ({
      id: company.company_id,
      label: company.company_name,
      value: company.team_size,
      icon: <FaIcons.FaBuilding className="text-3xl text-yellow-500" />,
      url: "#", 
    }))
  : [];

// Existing cards for Company and HR
const statCards = !isSuperUser
  ? [
      {
        id: "total-employees",
        label: "Total Employees",
        value: dashboardData.total_employees,
        icon: <FaIcons.FaUsers className="text-3xl text-blue-500" />,
        url: "/employee-details",
      },
      {
        id: "total-leave",
        label: "Total Leave Requests",
        value: dashboardData.total_leave_requests,
        icon: <FaIcons.FaClipboardList className="text-3xl text-green-500" />,
        url: "/leave-table",
      },
      {
        id: "upcoming-events",
        label: "Upcoming Events",
        value: dashboardData.upcoming_events,
        icon: <FaIcons.FaCalendarAlt className="text-3xl text-purple-500" />,
        url: "/events",
      },
    ]
  : superUserCards;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
          {dashboardData.company}
        </h2>
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="p-6 overflow-y-auto flex-1">
          {(isSuperUser || isCompany || roleId === 1 || roleId === 2) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {statCards.map(({ id, label, value, icon, url }) => (
                <Link
                  key={id}
                  to={url || "#"}
                  className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-all hover:bg-gray-50"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-gray-600">
                      {label}
                    </h4>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {value}
                    </p>
                  </div>
                  <div>{icon}</div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Links */}
    
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
