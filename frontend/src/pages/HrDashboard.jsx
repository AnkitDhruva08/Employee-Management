import { useState, useEffect } from "react";
import { FaUser, FaTicketAlt, FaWallet, FaCalendarAlt, FaUsers, FaClipboardList } from "react-icons/fa"; // ✅ import needed icons
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import { useNavigate, Link, useParams } from "react-router-dom";
import { fetchDashboard, fetchDashboardLink } from "../utils/api";
import * as FaIcons from "react-icons/fa";

const HrDashboard = () => {
  const [quickLinks, setQuickLinks] = useState([]);
  const HeaderTitle = 'Hr Dashboard';
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const HrDashboardUrl = `http://localhost:8000/api/hr-dashboard-link/`;


  // Fetch dashboard and quick links
  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token, HrDashboardUrl);
      const dashboardData = await fetchDashboard(token);
      console.log("Dashboard Ankit data:", dashboardData);
      setQuickLinks(links);
      setDashboardData(dashboardData);
      setLoading(false);
    } catch (err) {
      setError("Failed to load dashboard");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
    {/* Sidebar */}
    <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
      <h2 className="text-xl font-semibold text-white">
        {dashboardData.company}
      </h2>
      <div className="flex justify-center mb-8">
        {/* Render Sidebar */}
        <Sidebar quickLinks={quickLinks} />
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col">
      {/* ✅ Header */}
      <Header title={HeaderTitle} />

      <div className="p-6 overflow-y-auto flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              label: "Total Employees",
              value: dashboardData.total_employees,
              icon: <FaIcons.FaUsers className="text-3xl text-blue-500" />,
            },
            {
              label: "Total Leave Requests",
              value: dashboardData.total_leave_requests,
              icon: (
                <FaIcons.FaClipboardList className="text-3xl text-green-500" />
              ),
            },
            {
              label: "Upcoming Events",
              value: dashboardData.upcoming_events,
              icon: (
                <FaIcons.FaCalendarAlt className="text-3xl text-purple-500" />
              ),
            },
          ].map(({ label, value, icon }, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-all"
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
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickLinks.results?.map((link) => (
              <div
                key={link.id}
                className={`bg-${link.color}-500 shadow-lg rounded-xl p-6`}
              >
                <Link
                  to={link.path}
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

export default HrDashboard;
