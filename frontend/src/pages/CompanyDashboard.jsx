import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from "../componets/header/ Header";
import {
  FaBell,
  FaUserAlt,
  FaHome,
  FaCog
} from 'react-icons/fa';

const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/dashboard/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        setError("Failed to load data");
      }
    };

    fetchDashboard();
  }, []);

  if (error) {
    return <div className="text-red-600 text-center mt-10 text-xl">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center mt-10 text-xl">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <div className="flex justify-center mb-8">
          <h2 className="text-xl font-semibold text-white">{dashboardData.company}</h2>
        </div>
        <ul className="space-y-4 flex-1">
          <li>
            <Link to="/" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaHome className="mr-3" /> Home
            </Link>
          </li>
          <li>
            <Link to="/employees" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaUserAlt className="mr-3" /> Employees
            </Link>
          </li>
          <li>
            <Link to="/leave-requests" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaBell className="mr-3" /> Leave Requests
            </Link>
          </li>
          <li>
            <Link to="/role" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaCog className="mr-3" /> Roles
            </Link>
          </li>
          <li>
            <Link to="/events" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaBell className="mr-3" /> Events
            </Link>
          </li>
          <li>
            <Link to="/holidays" className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md">
              <FaBell className="mr-3" /> Holidays
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* ✅ Header */}
        <Header />

        <div className="p-6 overflow-y-auto flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-700">Total Employees</h3>
              <p className="text-4xl font-bold text-gray-800 mt-2">{dashboardData.total_employees}</p>
            </div>
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-700">Total Leave Requests</h3>
              <p className="text-4xl font-bold text-gray-800 mt-2">{dashboardData.total_leave_requests}</p>
            </div>
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-700">Upcoming Events</h3>
              <ul className="mt-2">
                {dashboardData.upcoming_events?.length > 0 ? (
                  dashboardData.upcoming_events.map((event, idx) => (
                    <li key={idx} className="text-gray-600 text-lg">
                      {event.name} - <span className="font-semibold">{event.date}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-600">No upcoming events</li>
                )}
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link to="/employee-details" className="bg-blue-500 text-white p-4 rounded-lg shadow-lg text-center hover:bg-blue-600 transition">
                Employees
              </Link>
              <Link to="/leave-table" className="bg-yellow-500 text-white p-4 rounded-lg shadow-lg text-center hover:bg-yellow-600 transition">
                Leave Requests
              </Link>
              <Link to="/role" className="bg-green-500 text-white p-4 rounded-lg shadow-lg text-center hover:bg-green-600 transition">
                Roles
              </Link>
              <Link to="/events" className="bg-indigo-500 text-white p-4 rounded-lg shadow-lg text-center hover:bg-indigo-600 transition">
                Events
              </Link>
              <Link to="/holidays" className="bg-purple-500 text-white p-4 rounded-lg shadow-lg text-center hover:bg-purple-600 transition">
                Holidays
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
