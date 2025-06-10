import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Phone, HeartHandshake, FileCheck } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import Header from "../header/Header";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import Sidebar from "../sidebar/Sidebar";
import Swal from 'sweetalert2';


export default function EmergencyContactForm({ onNext, onPrev }) {

  const { id } = useParams();
  console.log('emergency id ==<<>', id)
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
   const [empId, setId] = useState(null);
   const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem("token");
  const headerTitle = "Emergency Contact Details";

  //  Function for fetch emergency contact details
  const fetchEmergencyDetails = async () => {
    if(id){
      try {
        const response = await fetch(
          `http://localhost:8000/api/employee-emergency-details/${id}`,
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
            setId(emergency.id);
            setIsUpdating(true);
          }
        }
      } catch (err) {
        setError("Failed to load emergency contact data.");
      } finally {
        setLoading(false);
      }
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

  const handlePhoneChange = (phone) => {
    setEmergencyData((prevData) => ({
      ...prevData,
      emergency_contact: phone,
    }));
    setFormErrors((prevErrors) => ({ ...prevErrors, emergency_contact: "" }));
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
        ? `http://localhost:8000/api/employee-emergency-details/${id}/`
        : "http://localhost:8000/api/employee-emergency-details/";
        console.log('url ==<<<<>>', url)
      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (onNext) onNext();

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.detail || `Error: ${response.status}`);
      }

      setSuccess(
        isUpdating
          ? "Emergency contact saved successfully."
          : "Emergency contact saved successfully."
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
  
    {loading ? (
      <div className="text-center py-10 text-gray-500">Loading...</div>
    ) : (
      <div className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12">
        <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
          {isUpdating ? "Update Emergency Contact" : "Add Emergency Contact"}
        </h2>
  
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
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
  
            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <PhoneInput
                  country={"in"}
                  value={emergencyData.emergency_contact}
                  onChange={handlePhoneChange}
                  inputProps={{
                    id: "nominee_contact",
                    name: "nominee_contact",
                    className: `w-full pl-14 pr-4 py-3 text-sm rounded-xl transition-all duration-200 outline-none ${
                      formErrors.emergency_contact
                        ? "border border-red-500 focus:ring-2 focus:ring-red-300"
                        : "border border-gray-300 focus:ring-2 focus:ring-blue-400"
                    } bg-white text-gray-800 placeholder-gray-400 shadow-sm`,
                    placeholder: "e.g. +91 9876543210",
                  }}
                  containerStyle={{
                    width: "100%",
                    borderRadius: "0.75rem",
                    border: "none",
                  }}
                  buttonStyle={{
                    borderRadius: "0.75rem 0 0 0.75rem",
                    backgroundColor: "#f9fafb",
                    borderRight: formErrors.emergency_contact
                      ? "1px solid #ef4444"
                      : "1px solid #d1d5db",
                  }}
                  dropdownStyle={{
                    borderRadius: "0.75rem",
                  }}
                />
                {formErrors.nominee_contact && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nominee_contact}</p>
                )}
            </div>
            
            {/* Relation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
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
          </div>
  
          {/* Navigation Buttons */}
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
              {loading ? "Submitting..." : isUpdating ? "Next" : "Next"}
            </button>
          </div>
  
          {/* Status Messages */}
          {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
          {success && <p className="text-center text-green-600 font-semibold">{success}</p>}
        </form>
      </div>
    )}
  </div>
  
  
  );
}
