import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Banknote, CreditCard, FileCheck } from "lucide-react";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";


const NomineeDetails = () => {
  const [nomineeData, setNomineeData] = useState({
    nominee_name: "",
    nominee_dob: "",
    nominee_contact: "",
    nominee_relation: "",
  });

  const [quickLinks, setQuickLinks] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  const token = localStorage.getItem("token");
  const HeaderTitle = "Nominee Details";


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

      setSuccess(isUpdating ? "Nominee details updated successfully." : "Nominee details added successfully.");
      setIsUpdating(true);;
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err.message);
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
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >
            {[
              {
                label: "Name",
                name: "nominee_name",
                icon: <User className="w-5 h-5 text-blue-500" />,
              },
              {
                label: "Date of Birth",
                name: "nominee_dob",
                icon: <Banknote className="w-5 h-5 text-blue-500" />,
              },
              {
                label: "Contact Number",
                name: "nominee_contact",
                icon: <CreditCard className="w-5 h-5 text-blue-500" />,
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation
              </label>
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

export default NomineeDetails;
