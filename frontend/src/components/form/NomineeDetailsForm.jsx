import { useEffect, useState } from "react";
import { User, Banknote, CreditCard, FileCheck } from "lucide-react";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function NomineeDetailsForm({ onNext, onPrev }) {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem("token");

  const fetchNomineeDetails = async () => {
    setLoading(true);
    if (id) {
      try {
        const response = await fetch(`http://localhost:8000/api/employee-nominee-details/${id}`, {
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
        } else {
          if (response.status === 404) {
            setIsUpdating(false);
          } else {
            throw new Error(`Failed to fetch nominee details: ${response.statusText}`);
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDashboardLink(token);
        await fetchDashboard(token);
        await fetchNomineeDetails();
      } catch (err) {
        setError("Failed to load dashboard or nominee details.");
        setLoading(false);
      }
    };

    loadData();
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNomineeData({ ...nomineeData, [name]: value });
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handlePhoneChange = (phone) => {
    setNomineeData((prevData) => ({
      ...prevData,
      nominee_contact: phone,
    }));
    setFormErrors((prevErrors) => ({ ...prevErrors, nominee_contact: "" }));
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!nomineeData.nominee_name.trim()) {
      errors.nominee_name = "Nominee name is required.";
      isValid = false;
    }
    if (!nomineeData.nominee_dob) {
      errors.nominee_dob = "Date of birth is required.";
      isValid = false;
    }
    if (!nomineeData.nominee_contact.trim() || nomineeData.nominee_contact.length < 5) {
      errors.nominee_contact = "Valid contact number is required.";
      isValid = false;
    }
    if (!nomineeData.nominee_relation) {
      errors.nominee_relation = "Relation is required.";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      for (const key in nomineeData) {
        formData.append(key, nomineeData[key]);
      }

      const url = isUpdating
        ? `http://localhost:8000/api/employee-nominee-details/${id}/`
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
        throw new Error("Failed to submit. " + (errData?.detail || JSON.stringify(errData) || `Status: ${response.status}`));
      }

      // setSuccess(isUpdating ? "Nominee details updated successfully!" : "Nominee details saved successfully!");
      setIsUpdating(true);

      if (onNext) {
        setTimeout(() => {
          onNext();
        }, 1200);
      }
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
            {isUpdating ? "Update Nominee Details" : "Add Nominee Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-10" encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="nominee_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <input
                    type="text"
                    id="nominee_name"
                    name="nominee_name"
                    value={nomineeData.nominee_name || ""}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      formErrors.nominee_name
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  />
                </div>
                {formErrors.nominee_name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nominee_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="nominee_dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-blue-500" />
                  <input
                    type="date"
                    id="nominee_dob"
                    name="nominee_dob"
                    value={nomineeData.nominee_dob || ""}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      formErrors.nominee_dob
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  />
                </div>
                {formErrors.nominee_dob && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nominee_dob}</p>
                )}
              </div>

              <div>
                <label htmlFor="nominee_contact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <PhoneInput
                  country={"in"}
                  value={nomineeData.nominee_contact}
                  onChange={handlePhoneChange}
                  inputProps={{
                    id: "nominee_contact",
                    name: "nominee_contact",
                    className: `w-full pl-14 pr-4 py-3 text-sm rounded-xl transition-all duration-200 outline-none ${
                      formErrors.nominee_contact
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
                    borderRight: formErrors.nominee_contact
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

              <div>
                <label htmlFor="nominee_relation" className="block text-sm font-medium text-gray-700 mb-1">
                  Relation
                </label>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-500" />
                  <select
                    id="nominee_relation"
                    name="nominee_relation"
                    value={nomineeData.nominee_relation || ""}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none bg-white ${
                      formErrors.nominee_relation
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  >
                    <option value="">Select Relation</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                  </select>
                </div>
                {formErrors.nominee_relation && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nominee_relation}</p>
                )}
              </div>
            </div>

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