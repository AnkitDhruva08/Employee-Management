import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import Swal from "sweetalert2";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard, fecthevents } from "../utils/api";
import CompanyLogo from "../components/CompanyLogo";

const sampleEvents = [
  { id: 1, type: "Training", date: "2024-07-12", title: "Leadership Workshop", employee: "John Doe", description: "A one-day workshop focused on developing leadership skills.", status: "upcoming" },
  { id: 2, type: "Meeting", date: "2024-06-28", title: "Quarterly Review", employee: "Sarah Lee", description: "Discuss the goals achieved in Q2 and align plans for Q3.", status: "completed" },
  { id: 3, type: "Appraisal", date: "2024-07-05", title: "Performance Review", employee: "Emily Chen", description: "Annual employee performance evaluations.", status: "upcoming" },
  { id: 4, type: "Offboarding", date: "2024-06-20", title: "Exit Interview", employee: "Mike Johnson", description: "Conduct exit interview and knowledge transfer.", status: "cancelled" },
];

const statusStyles = {
  upcoming: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventType: "", eventDate: "", eventTitle: "",  eventDescription: "", eventStatus: "upcoming" });
  const [formErrors, setFormErrors] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const navigate = useNavigate();
  const { id } = useParams();

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
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      if (!isSuperUser) {
        const links = await fetchDashboardLink(token);
        setQuickLinks(links.data || links);
      }
      const empDashboard = await fetchDashboard(token);
      const eventsData = await fecthevents(token);
      console.log('eventsData =<<<>>', eventsData);
      setEvents(eventsData)
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };
  

  const validateForm = () => {
    const errors = {};
    if (!newEvent.eventType) errors.eventType = "Event type is required.";
    if (!newEvent.eventDate) errors.eventDate = "Date is required.";
    if (!newEvent.eventTitle) errors.eventTitle = "Title is required.";
    if (!newEvent.eventDescription) errors.eventDescription = "Description is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEvent = async () => {
    if (!validateForm()) return;
  
    const newId = events.length > 0 ? Math.max(...events.map((e) => e.id)) + 1 : 1;
  
    const payload = {
      id: newId,
      eventType: newEvent.eventType,
      eventTitle: newEvent.eventTitle,
      eventDate: newEvent.eventDate,
      eventDescription: newEvent.eventDescription,
      eventStatus: newEvent.eventStatus || "upcoming",
    };
  
    try {
      const token = localStorage.getItem("token"); // or use context/state
      const response = await fetch("http://localhost:8000/api/events/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add task.");
      }
  
      const result = await response.json();
  
      setEvents((prev) => [...prev, result]); // If server returns full event object
  
      setShowModal(false);
      setNewEvent({
        eventType: "",
        eventDate: "",
        eventTitle: "",
        eventDescription: "",
        eventStatus: "upcoming",
      });
      setFormErrors({});
  
      Swal.fire({
        icon: "success",
        title: "Event Added!",
        text: "The new event was successfully saved.",
        timer: 2000,
        showConfirmButton: false,
      });
  
    } catch (error) {
      console.error("Add Event Error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Add Event",
        text: error.message || "Something went wrong.",
      });
    }
  };
  

  if (error) return <div className="text-red-600 text-center mt-10 text-xl">{error}</div>;
  if (!dashboardData) return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {!isSuperUser && (
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
          {dashboardData && <CompanyLogo companyName={dashboardData.company} logoPath={dashboardData.company_logo} />}
          <Sidebar quickLinks={quickLinks} />
        </div>
      )}
      <main className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-blue-700 mb-10">Upcoming Events</h1>

            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
              >
                <FaIcons.FaPlus className="inline mr-2" />
                Create New Event
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-center text-gray-500">No events available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg p-6 transition transform hover:scale-[1.01]"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white uppercase">
                        {event.type}
                      </span>
                      <time className="text-sm text-gray-600 font-medium">
                        {new Date(event.date).toLocaleDateString()}
                      </time>
                    </div>
                    <h2 className="text-lg font-semibold text-blue-900">{event.title}</h2>
                    <p className="text-sm text-blue-600 mb-2">{event.employee}</p>
                    <p className="text-sm text-gray-700">{event.description}</p>
                    <div
                      className={`mt-4 text-xs font-semibold px-3 py-1 rounded-full w-fit ${statusStyles[event.status]}`}
                    >
                      {event.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
    <div className="bg-white rounded-xl w-full max-w-lg p-8 shadow-xl overflow-y-auto max-h-[90vh] relative">
      {/* ❌ Close Icon Button */}
      <button
        onClick={() => {
          setShowModal(false);
          setFormErrors({});
        }}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
        aria-label="Close"
      >
        &times;
      </button>

      <h2 className="text-2xl font-bold text-center mb-6">Create New Event</h2>

      {[
        { label: "Type", name: "eventType", type: "text" },
        { label: "Title", name: "eventTitle", type: "text" },
        { label: "Date", name: "eventDate", type: "date" },
        { label: "Description", name: "eventDescription", type: "textarea" },
      ].map(({ label, name, type }) => (
        <div className="mb-4" key={name}>
          <label className="block text-sm font-semibold text-gray-700 capitalize mb-1">
            {label}
          </label>

          {type === "textarea" ? (
            <textarea
              name={name}
              value={newEvent[name]}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formErrors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={newEvent[name]}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formErrors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
          {formErrors[name] && (
            <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => {
            setShowModal(false);
            setNewEvent({
              eventType: "",
              eventDate: "",
              eventTitle: "",
              eventDescription: "",
              eventStatus: "upcoming",
            });
            setFormErrors({});
          }}
          className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleAddEvent}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg shadow hover:shadow-lg"
        >
          Add Event
        </button>
      </div>
    </div>
  </div>
)}

      </main>
    </div>
  );
};

export default Events;
