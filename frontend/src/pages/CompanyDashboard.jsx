import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header/Header";
import * as FaIcons from "react-icons/fa";
import CompanySidebar from "../components/sidebar/CompanySidebar";
import { fetchCompanyDashboardLinks , fetchDashboard} from "../utils/api";
const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // For Fetch Dashboard Links
  const fetchLinks = async () => {
    try {
      const links = await fetchCompanyDashboardLinks(token);
      const dashboardData = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboardData);
    } catch (err) {
      setError("Failed to load quick links");
    }
  };

  const HeaderTitle = "Company Dashboard";

  // Use Effect to fetch dashboard data and quick links on component mount
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
          {dashboardData.company}
        </h2>
        <div className="flex justify-center mb-8">
          {/* Render Sidebar */}
          <CompanySidebar quickLinks={quickLinks} />
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

export default CompanyDashboard;
