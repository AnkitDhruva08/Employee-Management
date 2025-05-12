import { useEffect, useState } from "react";
import { User, Banknote, CreditCard, FileCheck } from "lucide-react";
import Header from "../header/Header";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import Swal from "sweetalert2";

export default function NomineeDetailsForm({ onNext, onPrev }) {
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
  const token = localStorage.getItem("token");
  const headerTitle = "Nominee Details";
  const [id, setId] = useState(null);

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
          setId(nominee.id);
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

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        await fetchDashboardLink(token);
        await fetchDashboard(token);
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

      const url = isUpdating
        ? `http://localhost:8000/api/employee-nominee-details/${existingData.id}/`
        : "http://localhost:8000/api/employee-nominee-details/";

      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error("Failed to submit. " + (errData?.detail || `Status: ${response.status}`));
      }
      if (onNext) onNext();

      setSuccess(isUpdating ? "Nominee details saved successfully." : "Nominee details Saved successfully.");
      setIsUpdating(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err.message);
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
            {isUpdating ? "Update Nominee Details" : "Add Nominee Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-10" encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  label: "Name",
                  name: "nominee_name",
                  icon: <User className="w-5 h-5 text-blue-500" />,
                  type: "text",
                },
                {
                  label: "Date of Birth",
                  name: "nominee_dob",
                  icon: <Banknote className="w-5 h-5 text-blue-500" />,
                  type: "date",
                },
                {
                  label: "Contact Number",
                  name: "nominee_contact",
                  icon: <CreditCard className="w-5 h-5 text-blue-500" />,
                  type: "text",
                },
              ].map(({ label, name, icon, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    {icon}
                    <input
                      type={type}
                      name={name}
                      value={nomineeData[name] || ""}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              {/* Relation */}
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

            {success && <p className="text-green-600 text-center mt-4">{success}</p>}
            {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
