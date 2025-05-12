import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Briefcase,
  UserCheck,
  LogOut,
  Clock,
} from "lucide-react";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import Swal from "sweetalert2";

export default function OfficeDetailsForm({ onNext, onPrev }) {
  const [officeData, setOfficeData] = useState({
    date_of_joining: "",
    probation_end: "",
    job_role: "",
    reporting_to: "",
    date_of_leaving: "",
  });

  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0 });
  const [quickLinks, setQuickLinks] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [id, setId] = useState(null);

  const token = localStorage.getItem("token");
  const headerTitle = "Employee Office Details";
  const navigate = useNavigate();

  const fetchOfficeDetails = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/employee-office-details/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const office = data[0];
          setOfficeData(office);
          calculateDuration(office.date_of_joining, office.date_of_leaving);
          setExistingData(office);
          setIsUpdating(true);
          setId(office.id);
        }
      }
    } catch (err) {
      setError("Error fetching office details.");
    } finally {
      setLoading(false);
    }
  };

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
      calculateDuration(updatedData.date_of_joining, updatedData.date_of_leaving);
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
          ? `http://localhost:8000/api/employee-office-details/${id}/`
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

      if (!response.ok) throw new Error("Failed to submit data.");

      if (onNext) onNext();
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
    <div className="max-w-7xl mx-auto">
      <Header title={headerTitle} />

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12">
          <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
            {isUpdating ? "Update Office Details" : "Add Office Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <Field
                label="Date of Joining"
                name="date_of_joining"
                type="date"
                value={officeData.date_of_joining}
                onChange={handleChange}
                icon={<Calendar className="w-5 h-5 text-blue-500" />}
              />
              <Field
                label="Probation End"
                name="probation_end"
                type="date"
                value={officeData.probation_end}
                onChange={handleChange}
                icon={<Clock className="w-5 h-5 text-blue-500" />}
              />
              <Field
                label="Job Role"
                name="job_role"
                type="text"
                value={officeData.job_role}
                onChange={handleChange}
                icon={<Briefcase className="w-5 h-5 text-blue-500" />}
              />
              <Field
                label="Reporting To"
                name="reporting_to"
                type="text"
                value={officeData.reporting_to}
                onChange={handleChange}
                icon={<UserCheck className="w-5 h-5 text-blue-500" />}
              />
              <Field
                label="Date of Leaving"
                name="date_of_leaving"
                type="date"
                value={officeData.date_of_leaving}
                onChange={handleChange}
                icon={<LogOut className="w-5 h-5 text-blue-500" />}
              />
            </div>

            {officeData.date_of_joining && officeData.date_of_leaving && (
              <p className="text-center text-gray-600">
                Duration: {duration.years} years, {duration.months} months, {duration.days} days
              </p>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={onPrev}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {loading ? "Submitting..." : "Next"}
              </button>
            </div>

            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {success && <p className="text-center text-green-600 font-semibold">{success}</p>}
          </form>
        </div>
      )}
    </div>
  );
}

// Reusable Field Component
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
