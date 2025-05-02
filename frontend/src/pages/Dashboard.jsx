import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";

const Dashboard = () => {
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  console.log("roleId:", roleId, "isCompany:", isCompany);
  let HeaderTitle = "";

  if (isCompany) {
    HeaderTitle = "Company Dashboard";
  } else if (roleId === 3) {
    HeaderTitle = "Employee Dashboard";
  } else if (roleId === 2) {
    HeaderTitle = "HR Dashboard";
  } else if (roleId === 1) {
    HeaderTitle = "Admin Dashboard";
  } else {
    HeaderTitle = "Dashboard";
  }

  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token);
      console.log("links For Dashboard <<>>:", links);
      const empDashboard = await fetchDashboard(token);
      setQuickLinks(links.data || links);
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching quick links:", err);
      setError("Failed to load quick links");
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  console.log("quickLinks:", quickLinks);

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
        <img
          src="/path/to/your/logo.png"
          alt="Company Logo"
          className="w-full h-full object-cover"
        />
          {dashboardData.company}
        </h2>
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        {/* Stats Cards */}

        <div className="p-6 overflow-y-auto flex-1">
          {(isCompany || roleId === 2) && (
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    label: "Total Employees",
                    value: dashboardData.total_employees,
                    icon: (
                      <FaIcons.FaUsers className="text-3xl text-blue-500" />
                    ),
                    url: "/employee-details",
                  },
                  {
                    label: "Total Leave Requests",
                    value: dashboardData.total_leave_requests,
                    icon: (
                      <FaIcons.FaClipboardList className="text-3xl text-green-500" />
                    ),
                    url: "/leave-table",
                  },
                  {
                    label: "Upcoming Events",
                    value: dashboardData.upcoming_events,
                    icon: (
                      <FaIcons.FaCalendarAlt className="text-3xl text-purple-500" />
                    ),
                    url: "/events",
                  },
                ].map(({ label, value, icon, url }, index) => (
                  <Link
                    to={url || "#"}
                    key={index}
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
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickLinks.dashboard_links?.map((link) => (
                <div
                  key={link.id}
                  className={`bg-${link.color}-500 shadow-lg rounded-xl p-6`}
                >
                  <Link
                    to={id ? `${link.path}/${id}` : link.path}
                    className="block text-center text-white font-medium transition"
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
