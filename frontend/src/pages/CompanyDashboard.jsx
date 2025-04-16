import React, { useEffect, useState } from 'react';
import { Outlet, Link } from "react-router-dom";

const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError("You are not logged in");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/', {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // if (!response.ok) {
        //   throw new Error('Unauthorized');
        // }

        const data = await response.json();
        console.log('data ===<<<>>', data);
        setDashboardData(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      }
    };

    fetchData();
  }, [token]);

  if (error) {
    return <div className="text-red-600 text-center mt-10">Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center mt-10">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome to the Company Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white shadow-md p-4 rounded-xl">
          <h3 className="font-semibold">Total Employees</h3>
          <p className="text-2xl">{dashboardData.total_employees}</p>
        </div>
        <div className="bg-white shadow-md p-4 rounded-xl">
          <h3 className="font-semibold">Total Leave Requests</h3>
          <p className="text-2xl">{dashboardData.total_leave_requests}</p>
        </div>
        <div className="bg-white shadow-md p-4 rounded-xl">
          <h3 className="font-semibold">Upcoming Events</h3>
          <ul className="list-disc list-inside">
            {dashboardData.upcoming_events?.length > 0 ? (
              dashboardData.upcoming_events.map((event, idx) => (
                <li key={idx}>{event.name} - {event.date}</li>
              ))
            ) : (
              <li>No upcoming events</li>
            )}
          </ul>
        </div>
      </div>

      <div className="p-6">
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Link className="bg-white p-4 shadow rounded" to="/employees">Employees</Link>
        <div className="bg-white p-4 shadow rounded">Leave Requests</div>
        <Link className="bg-white p-4 shadow rounded" to="/role">Roles</Link>
        <div className="bg-white p-4 shadow rounded">Events</div>
        <div className="bg-white p-4 shadow rounded">Holidays</div>
      </div>
    </div>
    </div>
  );
};

export default CompanyDashboard;
