import React from "react";
import { FaUser, FaTicketAlt, FaWallet, FaCalendarAlt } from "react-icons/fa";
import { FiSettings, FiUsers, FiClock, FiFileText, FiBarChart2 } from "react-icons/fi";

const HrDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-700 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="px-6 py-4 font-bold text-xl text-green-600">Your <span className="text-red-500">Logo</span></div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { icon: <FaUser />, label: "Dashboard" },
            { icon: <FiBarChart2 />, label: "Report" },
            { icon: <FiUsers />, label: "Staff" },
            { icon: <FaUser />, label: "Employee" },
            { icon: <FiClock />, label: "Timesheet" },
            { icon: <FiFileText />, label: "Training" },
            { icon: <FaWallet />, label: "Payroll" },
            { icon: <FiBarChart2 />, label: "Finance" },
            { icon: <FaUser />, label: "Performance" },
            { icon: <FiSettings />, label: "HR Admin Setup" },
            { icon: <FaUser />, label: "Recruitment" },
            { icon: <FiFileText />, label: "Contracts" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-green-50 cursor-pointer">
              <div className="text-green-500">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">Hi, <span className="font-bold">Viduranand!</span></div>
            <img
              src="https://randomuser.me/api/portraits/men/45.jpg"
              className="w-10 h-10 rounded-full border"
              alt="avatar"
            />
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card title="Total Staff" count={8} color="bg-green-100" icon={<FaUser />} />
          <Card title="Total Ticket" count={0} color="bg-blue-100" icon={<FaTicketAlt />} />
          <Card title="Account Balance" count={"$0.00"} color="bg-orange-100" icon={<FaWallet />} />
          <Card title="Total Jobs" count={0} color="bg-green-100" icon={<FaUser />} />
          <Card title="Active Jobs" count={0} color="bg-blue-100" icon={<FaUser />} />
          <Card title="Inactive Jobs" count={0} color="bg-orange-100" icon={<FaUser />} />
        </div>

        {/* Storage and Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Storage */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold text-lg mb-4">Storage Status (0MB / 512MB)</h3>
            <div className="flex items-center justify-center h-40">
              <div className="text-2xl font-bold text-green-600">0%</div>
              <div className="ml-2 text-sm">Used</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold text-lg mb-4">Calendar</h3>
            <div className="flex justify-between mb-2">
              <button className="bg-green-100 px-3 py-1 rounded">{"<"}</button>
              <div className="font-bold text-center">NOVEMBER 2023</div>
              <button className="bg-green-100 px-3 py-1 rounded">{">"}</button>
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded">Today</button>
              <button className="bg-gray-100 px-3 py-1 rounded">Month</button>
              <button className="bg-gray-100 px-3 py-1 rounded">Week</button>
              <button className="bg-gray-100 px-3 py-1 rounded">Day</button>
            </div>
            {/* You can add a real calendar component here (like FullCalendar) */}
          </div>
        </div>
      </main>
    </div>
  );
};

const Card = ({ title, count, color, icon }) => (
  <div className={`p-4 rounded shadow flex items-center gap-4 ${color}`}>
    <div className="text-2xl text-gray-700">{icon}</div>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-lg font-bold">{count}</p>
    </div>
  </div>
);

export default HrDashboard;
