import { useState, useEffect } from "react";
import { useNavigate, Link , useParams} from "react-router-dom";
import {
  FaUser, FaMoneyBill, FaCalendarAlt, FaFileAlt, FaCog,
  FaHome, FaPhoneAlt
} from 'react-icons/fa';


import Header from "../componets/header/ Header";

const EmployeeDashboard = () => {
  const { id } = useParams();
  console.log('id ===>', id)
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
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
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    };

    fetchUserDetails();
  }, []);

  const companyName = userData?.company || "Your Company";
  const cards = [
    {
      title: "BANK DETAILS",
      desc: "Update bank details",
      color: "bg-red-500",
      path: id ? `/bank-details/${id}` : "/bank-details",
      icon: <FaMoneyBill />
    },
    {
      title: "NOMINEE DETAILS",
      desc: "Update nominee details",
      color: "bg-green-500",
      path: id ? `/nominees-details/${id}` : "/nominees-details",
      icon: <FaUser />
    },
    {
      title: "DOCUMENTS",
      desc: "Manage employee documents",
      color: "bg-blue-500",
      path: id ? `/employee-documents/${id}` : "/employee-documents",
      icon: <FaFileAlt />
    },
    {
      title: "Emergency Contact Details*",
      desc: "Update emergency contact details",
      color: "bg-gray-600",
      path: id ? `/employee-emeregency-contact/${id}` : "/employee-emeregency-contact",
      icon: <FaPhoneAlt />
    },
    {
      title: "Office Details*",
      desc: "Update office details",
      color: "bg-teal-500",
      path: id ? `/employee-office-details/${id}` : "/employee-office-details",
      icon: <FaHome />
    },
    {
      title: "LEAVE",
      desc: "Apply or track leave",
      color: "bg-indigo-500",
      path: id ? `/leave-details/${id}` : "/leave-details",
      icon: <FaCalendarAlt />
    },
    {
      title: "HOLIDAY CALENDAR",
      desc: "View upcoming holidays",
      color: "bg-pink-500",
      path: id ? `/holiday-calendar/${id}` : "/holiday-calendar",
      icon: <FaCalendarAlt />
    },
    {
      title: "PAYSLIPS",
      desc: "Download your payslips",
      color: "bg-sky-500",
      path: id ? `/payslips/${id}` : "/payslips",
      icon: <FaMoneyBill />
    },
  ];
  

  const sidebarLinks = [
    { name: "Bank Details", path: id ? `/bank-details/${id}` : "/bank-details", icon: <FaMoneyBill /> },
    { name: "Nominee Details", path: id ? `/nominees-details/${id}` : "/nominees-details", icon: <FaUser /> },
    { name: "Documents", path: id ? `/employee-documents/${id}` : "/employee-documents", icon: <FaFileAlt /> },
    { name: "Emergency Contact", path: id ? `/employee-emeregency-contact/${id}` : "/employee-emeregency-contact", icon: <FaPhoneAlt /> },
    { name: "Office Details", path: id ? `/employee-office-details/${id}` : "/employee-office-details", icon: <FaHome /> },
    { name: "Leave", path: id ? `/leave-details/${id}` : "/leave-details", icon: <FaCalendarAlt /> },
    { name: "Holiday Calendar", path: id ? `/holiday-calendar/${id}` : "/holiday-calendar", icon: <FaCalendarAlt /> },
    { name: "Payslips", path: id ? `/payslips/${id}` : "/payslips", icon: <FaMoneyBill /> },
  ];
  

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col py-6 px-4 shadow-lg">
        <div className="text-2xl font-bold mb-8 text-center">{companyName}</div>
        <nav className="flex-1 space-y-4">
          {sidebarLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center px-2 py-2 rounded hover:bg-gray-700 transition text-lg"
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* ✅ Header Component */}
        <Header />

        {/* Cards Grid */}
        <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`rounded-lg shadow-md p-6 text-white cursor-pointer transition transform hover:scale-105 ${card.color}`}
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h2 className="text-xl font-bold mb-2">{card.title}</h2>
              <p className="text-sm mb-4">{card.desc}</p>
              <span className="underline">View →</span>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
