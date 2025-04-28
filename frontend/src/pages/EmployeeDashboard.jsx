import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import EmployeeSidebar from "../components/sidebar/EmployeeSidebar";
import Header from "../components/header/Header";
import { employeeDashboardLink, fetchDashboard } from "../utils/api";

const EmployeeDashboard = () => {
  const { id } = useParams(); 
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const HeaderTitle = "Employee Dashboard";

  const fetchLinks = async () => {
    try {
      const links = await employeeDashboardLink(token); 
      const dashboardData = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboardData);
    } catch (err) {
      setError("Failed to load quick links");
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
          {dashboardData.company}
        </h2>
        <div className="flex justify-center mb-8">
          <EmployeeSidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="p-6 overflow-y-auto flex-1">
          {/* Quick Links */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickLinks.results?.map((link) => (
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

export default EmployeeDashboard;
