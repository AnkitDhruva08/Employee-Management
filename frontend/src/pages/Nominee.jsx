import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Banknote, CreditCard, FileCheck } from "lucide-react";

const NomineeDetails = () => {
  const [nomineeData, setNomineeData] = useState({
    nominee_name: "",
    nominee_dob: "",
    nominee_contact: "",
    nominee_relation: "",
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

    const fetchNomineeDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/api/employee-nominee-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Nominee details:", data);
          if (Array.isArray(data) && data.length > 0) {
            const nominee = data[0];
            setNomineeData(nominee);
            setExistingData(nominee);
            setIsUpdating(true);
          } else {
            setIsUpdating(false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch nominee details", err);
        setLoading(false);
      }
    };

    fetchNomineeDetails();
  }, [token]);

  const handleChange = (e) => {
    setNomineeData({ ...nomineeData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      for (const key in nomineeData) {
        formData.append(key, nomineeData[key]);
      }

      const response = await fetch(
        isUpdating
          ? `http://localhost:8000/api/employee-nominee-details/${existingData.id}/`
          : "http://localhost:8000/api/employee-nominee-details/",
        {
          method: isUpdating ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error("Failed to submit. " + (errData?.detail || `Status: ${response.status}`));
      }

      setSuccess(isUpdating ? "Nominee details updated." : "Nominee details added.");
      setIsUpdating(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-3xl mt-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8 tracking-wide">
        {isUpdating ? "Update Nominee Details" : "Add Nominee Details"}
      </h2>

      {/* Display Existing Nominee Data */}
      {isUpdating && existingData && (
        <div className="mb-6 p-4 border border-blue-300 rounded-xl bg-white shadow-sm">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">Existing Nominee Details</h3>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Name:</strong> {existingData.nominee_name}</li>
            <li><strong>Date of Birth:</strong> {existingData.nominee_dob}</li>
            <li><strong>Contact:</strong> {existingData.nominee_contact}</li>
            <li><strong>Relation:</strong> {existingData.nominee_relation}</li>
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        {[
          { label: "Name", name: "nominee_name", icon: <User className="w-5 h-5 text-blue-500" /> },
          { label: "Date of Birth", name: "nominee_dob", icon: <Banknote className="w-5 h-5 text-blue-500" /> },
          { label: "Contact Number", name: "nominee_contact", icon: <CreditCard className="w-5 h-5 text-blue-500" /> },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <div className="flex items-center gap-2">
              {field.icon}
              <input
                type={field.name === "nominee_dob" ? "date" : "text"}
                name={field.name}
                value={nomineeData[field.name] || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
          </div>
        ))}

        {/* Relation Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            <select
              name="nominee_relation"
              value={nomineeData.nominee_relation || ""}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white"
            >
              <option value="">Select Relation</option>
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          {loading ? "Submitting..." : isUpdating ? "Update Details" : "Submit Details"}
        </button>
      </form>

      {/* Messages */}
      {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
    </div>
  );
};

export default NomineeDetails;
