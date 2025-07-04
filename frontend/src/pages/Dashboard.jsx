import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import { Line, Doughnut } from "react-chartjs-2";
import CompanyLogo from "../components/CompanyLogo";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";
  const baseUrl = "http://localhost:8000";

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

  const getColorByIndex = (index, saturation = 70, lightness = 60) => {
    const hue = (index * 137.508) % 360;
    const startColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const endColor = `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10
      }%)`;
    return `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
  };

  const fetchLinks = async ({
    token,
    isSuperUser,
    setQuickLinks,
    setDashboardData,
    setLoading,
    navigate,
  }) => {
    setLoading(true);
    try {
      if (!isSuperUser) {
        const links = await fetchDashboardLink(token);
        console.log('links =<<>>', links)
        setQuickLinks(links.data || links);
      }
      const empDashboard = await fetchDashboard(token);
      console.log('empDashboard ==<<>>', empDashboard)
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      if (err?.response?.status === 401 || err?.message?.includes("401")) {
        localStorage.removeItem("token");
        sessionStorage.clear();
        navigate("/login");
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const safeSet = (setter) => (data) => {
      if (isMounted) setter(data);
    };
    fetchLinks({
      token,
      isSuperUser,
      setQuickLinks: safeSet(setQuickLinks),
      setDashboardData: safeSet(setDashboardData),
      setLoading: safeSet(setLoading),
      navigate,
    });
    return () => {
      isMounted = false;
    };
  }, [token, isSuperUser, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-xl font-semibold text-gray-700">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <p className="text-red-700 text-lg text-center p-4 rounded-lg bg-white shadow-md">
          {error}
        </p>
      </div>
    );
  }
  // Conditional rendering for incomplete profile message for employees
  if (roleId === 3 && quickLinks) {
    if (!quickLinks.is_complete) {
      return (
        <div className="flex h-screen bg-gray-100">
          <div className="bg-gray-800 text-white w-64 p-6 flex flex-col shadow-lg">
            {dashboardData && (
              <CompanyLogo logoPath={dashboardData.company_logo} />
            )}
            <Sidebar quickLinks={quickLinks} />
          </div>
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header title={HeaderTitle} />
            <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto transform transition-transform duration-300 hover:scale-[1.02]">
                <FaIcons.FaExclamationTriangle className="text-yellow-500 text-6xl mb-6 mx-auto animate-bounce" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Profile Incomplete!
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  To access all data for this organization, please{" "}
                  <Link
                    to="/profile-page"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline transition-colors duration-200"
                  >
                    update your profile
                  </Link>
                  .
                </p>
                <p className="text-sm text-gray-500">
                  Your profile is essential for a complete experience.
                </p>
              </div>
            </div>
          </main>
        </div>
      );
    }

    else {
      return (
        <div className="flex h-screen bg-gray-100">
          <div className="bg-gray-800 text-white w-64 p-6 flex flex-col shadow-lg">
            {dashboardData && (
              <CompanyLogo logoPath={dashboardData.company_logo} />
            )}
            <Sidebar quickLinks={quickLinks} />
          </div>
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header title={HeaderTitle} />
            <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto transform transition-transform duration-300 hover:scale-[1.02]">
                <FaIcons.FaCheckCircle className="text-green-500 text-6xl mb-6 mx-auto animate-bounce" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Profile Complete!
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  You can now access all your role-based data and features.
                </p>

              </div>
            </div>
          </main>
        </div>
      );
    }

  }

  let statCards = [];

  if (isSuperUser && dashboardData?.companies) {
    statCards = dashboardData.companies.map((company, index) => {
      const companyLogoUrl = company.company_logo
        ? company.company_logo.startsWith("http")
          ? company.company_logo
          : `${baseUrl}${company.company_logo}`
        : null;
  
      const addressParts = [
        company.address?.street_address,
        company.address?.city,
        company.address?.state_province,
        company.address?.zip_code,
        company.address?.country,
      ].filter(Boolean);
  
      const fullAddress = addressParts.length > 0
        ? addressParts.join(", ")
        : "Address not available";
  
      return {
        id: company.company_id,
        companyName: company.company_name,
        teamSize: company.team_size,
        companyEmail: company.email || "Email not available",
        contactNumber: company.contact_number || "Not provided",
        company_size: company.company_size || "Unknown",
        companyLogo: companyLogoUrl,
        address: fullAddress,
        icon: <FaIcons.FaBuilding className="text-white text-4xl" />,
        gradient: getColorByIndex(index),
        url: `/company-details/${company.company_id}`,
      };
    });
  } else if ((isCompany || roleId === 1 || roleId === 2) && dashboardData) {
    statCards = [
      {
        id: "total-employees",
        label: "Total Employees",
        value: dashboardData.total_employees ?? 0,
        icon: <FaIcons.FaUsers className="text-white text-3xl" />,
        gradient: getColorByIndex(0),
        url: "/employee-details",
      },
      {
        id: "total-leave",
        label: "Leave Requests",
        value: dashboardData.total_leave_requests ?? 0,
        icon: <FaIcons.FaClipboardList className="text-white text-3xl" />,
        gradient: getColorByIndex(1),
        url: "/leave-table",
      },
      {
        id: "upcoming-events",
        label: "Upcoming Events",
        value: Array.isArray(dashboardData.upcoming_events)
          ? dashboardData.upcoming_events.length
          : 0,
        icon: <FaIcons.FaCalendarAlt className="text-white text-3xl" />,
        gradient: getColorByIndex(2),
        url: "/events",
      },
      {
        id: "total-project",
        label: "Total Projects",
        value: quickLinks.total_projects ?? 0,
        icon: <FaIcons.FaProjectDiagram className="text-white text-3xl" />,
        gradient: getColorByIndex(3),
        url: "/projects",
      },
      {
        id: "total-task",
        label: "Total Tasks",
        value: quickLinks.total_tasks ?? 0,
        icon: <FaIcons.FaTasks className="text-white text-3xl" />,
        gradient: getColorByIndex(4),
        url: "/create-task",
      },
      {
        id: "departments",
        label: "Departments",
        value: Array.isArray(dashboardData.departments)
          ? dashboardData.departments.length
          : (dashboardData.departments ?? 0),
        icon: <FaIcons.FaSitemap className="text-white text-3xl" />,
        gradient: getColorByIndex(5),
        url: "/departments",
      },
    ];
  }
  

  return (
    <div className="flex h-screen bg-gray-100">
      {!isSuperUser && (
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col shadow-lg">
          {dashboardData && (
            <CompanyLogo logoPath={dashboardData.company_logo} />
          )}
          <Sidebar quickLinks={quickLinks} />
        </div>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={HeaderTitle} />
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-indigo-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {statCards.length > 0 ? (
              statCards.map((card) => (
                <Link
                  key={card.id}
                  to={card.url || "#"}
                  style={{ background: card.gradient }}
                  className="relative rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.03] border border-gray-100 group"
                >
                  {isSuperUser ? (
                    <>
                      <div className="flex justify-between items-start mb-4 no-wrap">
                        <div className="flex-grow pr-4 no-wrap">
                          <h2 className="text-2xl font-bold mb-1 leading-tight">
                            {card.companyName}
                          </h2>
                          {card.companyEmail && (
                            <p className="text-sm opacity-90 break-words mt-1">
                              <span className="font-semibold">Email:</span>{" "}
                              {card.companyEmail}
                            </p>
                          )}
                          {card.contactNumber && (
                            <p className="text-sm opacity-90 mt-1">
                              <span className="font-semibold">Contact:</span>{" "}
                              {card.contactNumber}
                            </p>
                          )}
                          {card.company_size && (
                            <p className="text-sm opacity-90 mt-1">
                              <span className="font-semibold">
                                Company Size:
                              </span>{" "}
                              {card.company_size}
                            </p>
                          )}
                          {card.address && (
                            <p className="text-sm opacity-90 mt-1 break-words">
                              <span className="font-semibold">Address:</span>{" "}
                              {card.address}
                            </p>
                          )}
                        </div>
                        {card.companyLogo ? (
                          <img
                            src={card.companyLogo}
                            alt={`${card.companyName} Logo`}
                            className="w-24 h-24 no-wrap object-contain rounded-full bg-white p-1 shadow-md flex-shrink-0 transition-transform duration-300 group-hover:rotate-6"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-indigo-700 flex items-center justify-center text-4xl font-bold flex-shrink-0 shadow-md transition-transform duration-300 group-hover:rotate-6">
                            {card?.companyName
                              ? card.companyName.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white border-opacity-30">
                        <span className="text-xl font-semibold">
                          Team Size: {card.teamSize}
                        </span>
                        {card.icon}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium">{card.label}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-4xl font-bold">{card.value}</p>
                        {card.icon}
                      </div>
                    </>
                  )}
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600 text-lg py-10">
                No dashboard data available for your role.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
