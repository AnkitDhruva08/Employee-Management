import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { fetchRoles } from "../utils/api";

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    company_email: "",
    personal_email: "",
    date_of_birth: "",
    gender: "",
    job_role: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  let headerContent = id ? "UPDATE EMPLOYEE RECORDS" : "ADD NEW EMPLOYEE";
  let buttonText = id ? "UPDATE EMPLOYEE" : "ADD EMPLOYEE";

  const fetchLinks = async () => {
    try {
      const userRoles = await fetchRoles(token);
      console.log("userRoles for add employee ==<<>>", userRoles);
      setRoles(userRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setApiError("Failed to load job roles.");
    }
  };

  useEffect(() => {
    if (id) {
      const fetchEmployee = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No auth token found");
          }

          const res = await fetch(
            `http://localhost:8000/api/employees/${id}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to fetch employee");
          }
          const data = await res.json();

          setFormData({
            first_name: data.first_name || "",
            middle_name: data.middle_name || "",
            last_name: data.last_name || "",
            contact_number: data.contact_number || "",
            company_email: data.company_email || "",
            personal_email: data.personal_email || "",
            date_of_birth: data.date_of_birth || "",
            gender: data.gender || "",
            job_role: data.role_id || "",
          });
        } catch (err) {
          console.error("Error loading employee:", err);
          setApiError(
            err.message || "Failed to load employee data. Please login again."
          );
          Swal.fire({
            title: "Error!",
            text: err.message || "Failed to load employee data.",
            icon: "error",
            confirmButtonText: "OK",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
    fetchLinks();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, contact_number: value });
    if (formErrors.contact_number) {
      setFormErrors((prevErrors) => ({ ...prevErrors, contact_number: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name.trim()) {
      errors.first_name = "First Name is required.";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Last Name is required.";
    }
    if (!formData.contact_number.trim()) {
      errors.contact_number = "Contact Number is required.";
    } else if (formData.contact_number.length < 10) {
      errors.contact_number = "Contact Number is too short.";
    }
    if (!formData.company_email.trim()) {
      errors.company_email = "Company Email is required.";
    } else if (!emailRegex.test(formData.company_email)) {
      errors.company_email = "Invalid Company Email format.";
    }
    if (
      formData.personal_email.trim() &&
      !emailRegex.test(formData.personal_email)
    ) {
      errors.personal_email = "Invalid Personal Email format.";
    }
    if (!formData.date_of_birth) {
      errors.date_of_birth = "Date of Birth is required.";
    }
    if (!formData.gender) {
      errors.gender = "Gender is required.";
    }
    if (!formData.job_role) {
      errors.job_role = "Job Role is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const isValid = validateForm();
    if (!isValid) {
      Swal.fire({
        title: "Validation Error!",
        text: "Please correct the errors in the form.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setApiError("Unauthorized. Please login again.");
      setLoading(false);
      return;
    }

    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost:8000/api/employees/${id}/`
      : "http://localhost:8000/api/employees/";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const successTitle = id ? "Updated!" : "Added!";
        const successText = id
          ? "Employee record has been updated."
          : "New employee has been added.";

        Swal.fire({
          title: successTitle,
          text: successText,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Add More",
          cancelButtonText: "Go to Employee List",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            setFormData({
              first_name: "",
              middle_name: "",
              last_name: "",
              contact_number: "",
              company_email: "",
              personal_email: "",
              date_of_birth: "",
              gender: "",
              job_role: "",
            });
            setFormErrors({});
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            navigate("/employee-details");
          }
        });
      } else {
        const errorData = await response.json();
        setApiError(
          errorData?.detail || errorData?.error || "Operation failed."
        );
        Swal.fire({
          title: "Error!",
          text: errorData?.detail || errorData?.error || "Operation failed.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      setApiError(
        "Server error. There was a problem connecting to the server."
      );
      Swal.fire({
        title: "Error!",
        text: "There was a problem connecting to the server.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && id && Object.keys(formData).every((key) => !formData[key])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-blue-600 text-xl font-medium animate-pulse">
          Loading employee data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-sans">
      <div className="max-w-6xl w-full mx-auto my-8 p-10 bg-white rounded-3xl shadow-2xl border border-gray-200 transform transition-transform duration-300 ease-in-out hover:scale-[1.005]">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-blue-800 mb-10 tracking-tight drop-shadow-md animate-fadeIn">
          ✨ {headerContent} ✨
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Title for Personal Information */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 border-b-2 border-blue-200 pb-3 mb-6 relative group">
            Personal Information
            <span className="absolute left-0 bottom-0 w-16 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* First Name Input */}
            <div className="relative group">
              <label
                htmlFor="first_name"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.first_name ? "border-red-500" : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400`}
                placeholder="e.g. John"
                autoComplete="given-name"
              />
              {formErrors.first_name && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.first_name}
                </p>
              )}
            </div>

            {/* Middle Name Input */}
            <div className="relative group">
              <label
                htmlFor="middle_name"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                Middle Name
              </label>
              <input
                type="text"
                id="middle_name"
                name="middle_name"
                value={formData.middle_name || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.middle_name ? "border-red-500" : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400`}
                placeholder="e.g. David"
                autoComplete="additional-name"
              />
              {formErrors.middle_name && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.middle_name}
                </p>
              )}
            </div>

            {/* Last Name Input */}
            <div className="relative group">
              <label
                htmlFor="last_name"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.last_name ? "border-red-500" : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400`}
                placeholder="e.g. Doe"
                autoComplete="family-name"
              />
              {formErrors.last_name && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.last_name}
                </p>
              )}
            </div>

            {/* Contact Number Input */}

            <div className="mb-4">
              <label
                htmlFor="contact_number"
                className="block text-gray-800 font-semibold mb-2 text-sm"
              >
                📞 Company Contact Number
              </label>
              <PhoneInput
                country={"in"}
                value={formData.contact_number}
                onChange={handlePhoneChange}
                inputProps={{
                  id: "contact_number",
                  name: "contact_number",
                  className: `w-full pl-14 pr-4 py-3 text-sm rounded-xl transition-all duration-200 outline-none ${
                    formErrors.contact_number
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
                  borderRight: formErrors.contact_number
                    ? "1px solid #ef4444"
                    : "1px solid #d1d5db",
                }}
                dropdownStyle={{
                  borderRadius: "0.75rem",
                }}
              />
              {formErrors.contact_number && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.contact_number}
                </p>
              )}
            </div>

            {/* Company Email Input */}
            <div className="relative group">
              <label
                htmlFor="company_email"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                🏢 Company Email
              </label>
              <input
                type="email"
                id="company_email"
                name="company_email"
                value={formData.company_email || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.company_email
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400`}
                placeholder="e.g. john.doe@company.com"
                autoComplete="organization-email"
              />
              {formErrors.company_email && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.company_email}
                </p>
              )}
            </div>

            {/* Personal Email Input */}
            <div className="relative group">
              <label
                htmlFor="personal_email"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                ✉️ Personal Email
              </label>
              <input
                type="email"
                id="personal_email"
                name="personal_email"
                value={formData.personal_email || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.personal_email
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400`}
                placeholder="e.g. john.doe@example.com"
                autoComplete="email"
              />
              {formErrors.personal_email && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.personal_email}
                </p>
              )}
            </div>

            {/* Date of Birth Input */}
            <div className="relative group">
              <label
                htmlFor="date_of_birth"
                className="block text-sm text-gray-700 font-medium mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                🎂 Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.date_of_birth
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200`}
              />
              {formErrors.date_of_birth && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.date_of_birth}
                </p>
              )}
            </div>

            {/* Gender Select */}
            <div className="relative group">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                🚻 Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.gender ? "border-red-500" : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none appearance-none transition-all duration-200`}
              >
                <option value="">-- Select --</option>
                {["Male", "Female", "Other"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 top-7">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
              {formErrors.gender && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.gender}
                </p>
              )}
            </div>

            {/* Job Role Select */}
            <div className="relative group">
              <label
                htmlFor="job_role"
                className="block text-sm font-medium text-gray-700 mb-1 transition-all duration-200 group-focus-within:text-blue-600"
              >
                💼 Job Role
              </label>
              <select
                id="job_role"
                name="job_role"
                value={formData.job_role}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border ${
                  formErrors.job_role ? "border-red-500" : "border-gray-300"
                } rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none appearance-none transition-all duration-200`}
              >
                <option value="">-- Select --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 top-7">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
              {formErrors.job_role && (
                <p className="text-red-500 text-xs mt-1 italic">
                  {formErrors.job_role}
                </p>
              )}
            </div>
          </div>

          {apiError && (
            <p className="text-red-600 font-semibold text-center mt-8 p-3 bg-red-50 rounded-lg border border-red-200 animate-shake">
              {apiError}
            </p>
          )}

          <div className="flex mt-12 justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-12 rounded-full text-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {id ? "UPDATING..." : "ADDING..."}
                </div>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
