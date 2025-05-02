import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Briefcase, UserCheck, LogOut, Clock } from "lucide-react";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";


const OfficeDetails = () => {
  const [officeData, setOfficeData] = useState({
    date_of_joining: "",
    probation_end: "",
    job_role: "",
    reporting_to: "",
    date_of_leaving: "",
  });

  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0 });
  const navigate = useNavigate();
  const [quickLinks, setQuickLinks] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const token = localStorage.getItem("token");
  const HeaderTitle = "Employee Office Details";

  // Function for fetch office details
  const fetchOfficeDetails = async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/api/employee-office-details/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const office = data[0];
          setOfficeData(office);
          calculateDuration(office.date_of_joining, office.date_of_leaving);
          setExistingData(office);
          setIsUpdating(true);
        }
      }
    } catch (err) {
      setError("Error fetching office details.");
    } finally {
      setLoading(false);
    }
  };

  // calling useEffect to fetch nominee details and dashboard data
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const links = await fetchDashboardLink(token);
        const dashboardData = await fetchDashboard(token);
        setQuickLinks(links);
        setDashboardData(dashboardData);
      } catch (err) {
        setError("Failed to load dashboard");
      }
    };

    fetchLinks();
    fetchOfficeDetails();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...officeData, [name]: value };
    setOfficeData(updatedData);

    if (name === "date_of_joining" || name === "date_of_leaving") {
      calculateDuration(
        updatedData.date_of_joining,
        updatedData.date_of_leaving
      );
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      days += 30;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    setDuration({ years, months, days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        isUpdating
          ? `http://localhost:8000/api/employee-office-details/${officeData.id}/`
          : "http://localhost:8000/api/employee-office-details/",
        {
          method: isUpdating ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(officeData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit data.");
      }

      setSuccess(
        isUpdating ? "Office details updated." : "Office details added."
      );
      setIsUpdating(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold">{dashboardData?.company}</h2>
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg mt-6">
          <h2 className="text-2xl font-semibold text-center mb-6 text-blue-700">
            {isUpdating ? "Update Your Office Details" : "Add Your Office Details"}
          </h2>

          {/* Form */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date of Joining */}
            <Field
              label="Date of Joining"
              name="date_of_joining"
              value={officeData.date_of_joining}
              onChange={handleChange}
              type="date"
              icon={<Calendar className="w-5 h-5 text-blue-500" />}
            />

            {/* Probation End Date */}
            <Field
              label="Probation End Date"
              name="probation_end"
              value={officeData.probation_end}
              onChange={handleChange}
              type="date"
              icon={<Calendar className="w-5 h-5 text-blue-500" />}
            />

            {/* Job Role */}
            <Field
              label="Job Role / Designation"
              name="job_role"
              value={officeData.job_role}
              onChange={handleChange}
              type="text"
              icon={<Briefcase className="w-5 h-5 text-blue-500" />}
            />

            {/* Reporting To */}
            <Field
              label="Reporting To (Name / Designation)"
              name="reporting_to"
              value={officeData.reporting_to}
              onChange={handleChange}
              type="text"
              icon={<UserCheck className="w-5 h-5 text-blue-500" />}
            />

            {/* Date of Leaving */}
            <Field
              label="Date of Leaving"
              name="date_of_leaving"
              value={officeData.date_of_leaving}
              onChange={handleChange}
              type="date"
              icon={<LogOut className="w-5 h-5 text-blue-500" />}
            />

            {/* Duration */}
            <div className="border-t pt-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Working Duration
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                {duration.years} Year(s), {duration.months} Month(s),{" "}
                {duration.days} Day(s)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
            >
              {loading
                ? "Submitting..."
                : isUpdating
                ? "Update Details"
                : "Submit Details"}
            </button>

            {/* Status Messages */}
            {success && (
              <p className="text-green-600 text-center mt-4">{success}</p>
            )}
            {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="flex items-center gap-2">
      {icon}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
      />
    </div>
  </div>
);

export default OfficeDetails;
