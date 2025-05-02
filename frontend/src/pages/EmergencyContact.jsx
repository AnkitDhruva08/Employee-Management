import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, HeartHandshake, FileCheck } from "lucide-react";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";

const EmergencyContact = () => {
  const [emergencyData, setEmergencyData] = useState({
    emergency_name: "",
    emergency_relation: "",
    emergency_contact: "",
  });

  const [quickLinks, setQuickLinks] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const HeaderTitle = "Emergency Contact Details";

  //  Function for fetch emergency contact details
  const fetchEmergencyDetails = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/employee-emergency-details/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const emergency = data[0];
          setEmergencyData(emergency);
          setExistingData(emergency);
          setIsUpdating(true);
        }
      }
    } catch (err) {
      setError("Failed to load emergency contact data.");
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
    fetchEmergencyDetails();
  }, [token]);

  const handleChange = (e) => {
    setEmergencyData({ ...emergencyData, [e.target.name]: e.target.value });
  };

  // Function for handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      for (const key in emergencyData) {
        formData.append(key, emergencyData[key]);
      }

      const url = isUpdating
        ? `http://localhost:8000/api/employee-emergency-details/${existingData.id}/`
        : "http://localhost:8000/api/employee-emergency-details/";

      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.detail || `Error: ${response.status}`);
      }

      setSuccess(
        isUpdating
          ? "Emergency contact updated successfully."
          : "Emergency contact added successfully."
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
            {isUpdating ? "Update Your Bank Details" : "Add Your Bank Details"}
          </h2>

          {/* Form */}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  name="emergency_name"
                  value={emergencyData.emergency_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                <input
                  type="tel"
                  name="emergency_contact"
                  value={emergencyData.emergency_contact}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation
              </label>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-blue-500" />
                <select
                  name="emergency_relation"
                  value={emergencyData.emergency_relation}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white"
                >
                  <option value="">Select Relation</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
            >
              {loading
                ? "Submitting..."
                : isUpdating
                ? "Update Contact"
                : "Add Contact"}
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

export default EmergencyContact;
