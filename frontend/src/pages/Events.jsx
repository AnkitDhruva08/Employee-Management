import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import { Line, Doughnut } from "react-chartjs-2";

const sampleEvents = [
    {
      id: 1,
      type: "Training",
      date: "2024-07-12",
      title: "Leadership Workshop",
      employee: "John Doe",
      description: "A one-day workshop focused on developing leadership skills for managers and team leads.",
      status: "upcoming",
    },
    {
      id: 2,
      type: "Meeting",
      date: "2024-06-28",
      title: "Quarterly Review",
      employee: "Sarah Lee",
      description: "Discuss the goals achieved in Q2 and align on plans for Q3 across all departments.",
      status: "completed",
    },
    {
      id: 3,
      type: "Appraisal",
      date: "2024-07-05",
      title: "Annual Performance Review",
      employee: "Emily Chen",
      description: "Annual employee performance evaluations and goal setting for next year.",
      status: "upcoming",
    },
    {
      id: 4,
      type: "Offboarding",
      date: "2024-06-20",
      title: "Exit Interview",
      employee: "Mike Johnson",
      description: "Conduct exit interview and knowledge transfer from departing employee.",
      status: "cancelled",
    },
  ];
  
  const statusStyles = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

const Events = () => {
  const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const { id } = useParams();
  
    const [dashboardData, setDashboardData] = useState(null);
    const [quickLinks, setQuickLinks] = useState([]);
    const [error, setError] = useState(null);
  
    const token = localStorage.getItem("token");
    const roleId = parseInt(localStorage.getItem("role_id"));
    const isCompany = localStorage.getItem("is_company") === "true";
    const isSuperUser = localStorage.getItem("is_superuser") === "true";


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
    
      useEffect(() => {
        const fetchLinks = async () => {
          try {
            if (!isSuperUser) {
              const links = await fetchDashboardLink(token);
              setQuickLinks(links.data || links);
            }
            const empDashboard = await fetchDashboard(token);
            setDashboardData(empDashboard);
          } catch (err) {
            console.error("Error fetching dashboard:", err);
            navigate("/login");
          }
        };
    
        fetchLinks();
        setEvents(sampleEvents);
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
          {!isSuperUser && (
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            {dashboardData.company}
          </h2>
          <Sidebar quickLinks={quickLinks} />
        </div>
      )}
       <main className="flex-1 flex flex-col">
      <Header title={HeaderTitle} />

      <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-10">
            Upcoming Events
          </h1>

          {events.length === 0 ? (
            <div className="text-center text-gray-500">No events available at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 flex flex-col justify-between transition duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                      {event.type}
                    </span>
                    <time className="text-sm text-gray-600 font-medium">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h2 className="text-lg font-semibold text-blue-900 mb-1">{event.title}</h2>
                  <div className="text-blue-600 font-medium text-sm mb-2">{event.employee}</div>
                  <p className="text-gray-700 text-sm flex-grow">{event.description}</p>
                  <div
                    className={`mt-4 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full w-fit ${statusStyles[event.status]}`}
                  >
                    {event.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
    
  );
};

export default Events;
