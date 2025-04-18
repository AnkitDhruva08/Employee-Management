import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, HeartHandshake, FileCheck } from "lucide-react";

const EmergencyContact = () => {
  const [emergencyData, setEmergencyData] = useState({
    emergency_name: "",
    emergency_relation: "",
    emergency_contact: "",
  });

  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchEmergencyDetails = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/employee-emergency-details/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
        console.error("Failed to fetch emergency contact", err);
        setError("Failed to load emergency contact data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyDetails();
  }, [token, navigate]);

  const handleChange = (e) => {
    setEmergencyData({ ...emergencyData, [e.target.name]: e.target.value });
  };

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

      console.log('token ==<<>>', token);

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

      setSuccess(isUpdating ? "Emergency contact updated successfully." : "Emergency contact added successfully.");
      setIsUpdating(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-3xl mt-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8 tracking-wide">
        {isUpdating ? "Update Emergency Contact*" : "Add Emergency Contact*"}
      </h2>

      {isUpdating && existingData && (
        <div className="mb-6 p-4 border border-blue-300 rounded-xl bg-white shadow-sm">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">Existing Emergency Contact</h3>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Name:</strong> {existingData.emergency_name}</li>
            <li><strong>Contact:</strong> {existingData.emergency_contact}</li>
            <li><strong>Relation:</strong> {existingData.emergency_relation}</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          {loading ? "Submitting..." : isUpdating ? "Update Contact" : "Add Contact"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
    </div>
  );
};

export default EmergencyContact;
