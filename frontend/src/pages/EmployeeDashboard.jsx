import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("token ==<<<>>>", token);

        const res = await fetch("http://localhost:8000/api/dashboard/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        console.log("data ==<<<>>>", data);
        setUserData(data);
      } catch (err) {
        console.error("Error loading roles:", err);
      }
    };

    fetchUserDetails();
  }, []);

  const companyName = userData?.company || "Your Company";
  const employee = userData?.employee_details?.[0];
  const firstName = employee?.first_name || "E";
  const role = userData?.role || "Employee";

  const cards = [
    {
      title: "BANK DETAILS",
      desc: "Update bank details",
      color: "bg-red-500",
      path: "/bank-details",
    },
    {
      title: "NOMINEE DETAILS",
      desc: "Update nominee details",
      color: "bg-green-500",
      path: "/nominees-details",
    },
    {
      title: "DOCUMENTS",
      desc: "Manage employee documents",
      color: "bg-blue-500",
      path: "/employee-documents",
    },
    {
      title: "Emergency Contact Details*",
      desc: "Update emergency contact details",
      color: "bg-gray-600",
      path: "/employee-emeregency-contact",
    },
    {
      title: "Office Details*",
      desc: "Update office details",
      color: "bg-teal-500",
      path: "/employee-office-details",
    },
    {
      title: "LEAVE",
      desc: "Apply or track leave",
      color: "bg-indigo-500",
      path: "/leave-details",
    },
    {
      title: "HOLIDAY CALENDAR",
      desc: "View upcoming holidays",
      color: "bg-pink-500",
      path: "/holiday-calendar",
    },
    {
      title: "PAYSLIPS",
      desc: "Download your payslips",
      color: "bg-sky-500",
      path: "/payslips",
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col py-6 px-4">
        <div className="text-2xl font-bold mb-8">{companyName}</div>
        <nav className="flex-1 space-y-2">
          {[
            "Employee Files",
            "Reports",
            "Payroll",
            "Invoices",
            "Settings",
            "Documents",
            "Contact Info",
            "Paycheck Calculators",
            "Time Clock",
            "Manage Leave",
            "Manage Timesheets",
          ].map((item) => (
            <a
              key={item}
              href="#"
              className="block px-2 py-2 rounded hover:bg-gray-700 transition"
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <div></div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
              {firstName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">
                {employee?.first_name} {employee?.last_name}
              </p>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>
        </header>

        {/* Dashboard Cards */}
        <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`rounded-lg shadow-md p-6 text-white cursor-pointer transition transform hover:scale-105 ${card.color}`}
            >
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
