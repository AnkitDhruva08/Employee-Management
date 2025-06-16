import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/File/FileUpload";
import PhoneInput from "react-phone-input-2";
import Swal from "sweetalert2";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    team_size: "",
    email: "",
    password: "",
    confirm_password: "",
    street_address: "",
    city: "",
    state_province: "",
    zip_code: "",
    country: "",
    contact_number: "",
    company_logo: null, 
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    sessionStorage.clear();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the specific error when the user starts typing/changing the field
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
    // Special handling for password and confirm_password to clear confirm_password error
    if (name === "password" && formErrors.confirm_password) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: null,
      }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, contact_number: value });
    // Clear error for phone number
    if (formErrors?.contact_number) {
      setFormErrors((prevErrors) => ({ ...prevErrors, contact_number: null }));
    }
  };

  const handleLogoUpload = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          company_logo: "Only PNG, JPG, or JPEG files are allowed.",
        }));
        setFormData((prevData) => ({
          ...prevData,
          company_logo: files, 
        }));
      } else {
        // Clear error and set the file if it's a valid type
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          company_logo: null,
        }));
        setFormData((prevData) => ({
          ...prevData,
          company_logo: files,
        }));
      }
    } else {
      // If no file is selected (e.g., cleared), remove the file and any error
      setFormData((prevData) => ({
        ...prevData,
        company_logo: null,
      }));
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        company_logo: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Company Name Validation
    if (!formData.company_name.trim()) {
      errors.company_name = "Company name is required.";
    } else if (formData.company_name.trim().length < 3) {
      errors.company_name = "Company name must be at least 3 characters long.";
    }

    // Team Size Validation
    if (!formData.team_size) {
      errors.team_size = "Team size is required.";
    }

    // Email Validation
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Invalid email format.";
      }
    }

    // Contact Number Validation
    if (!formData.contact_number.trim()) {
      errors.contact_number = "Contact number is required.";
    } else if (formData.contact_number.length < 10) {
      // Assuming a minimum length of 10 digits for a valid phone number (after stripping country code, etc.)
      errors.contact_number = "Contact number must be at least 10 digits long.";
    }

    // Password Validation
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        errors.password =
          "Password must include uppercase, lowercase, number, and special character.";
      }
    }

    // Confirm Password Validation
    if (!formData.confirm_password) {
      errors.confirm_password = "Confirm password is required.";
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match.";
    }

    if (formData.company_logo && formData.company_logo.length > 0) {
      const file = formData.company_logo[0];
      const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];
      if (!allowedTypes.includes(file.type)) {
        errors.company_logo = "Only PNG, JPG, or JPEG files are allowed.";
      }
    }

    // Address Validation
    if (!formData.street_address.trim()) {
      errors.street_address = "Street address is required.";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required.";
    }
    if (!formData.state_province.trim()) {
      errors.state_province = "State/Province is required.";
    }

    // Zip Code Validation
    if (!formData.zip_code.trim()) {
      errors.zip_code = "Zip/Postal code is required.";
    } else {
      const zipRegex = /^\d{5,10}$/; 
      if (!zipRegex.test(formData.zip_code)) {
        errors.zip_code = "Zip/Postal code must be 5–10 digits.";
      }
    }

    // Country Validation
    if (!formData.country.trim()) {
      errors.country = "Country is required.";
    }

    setFormErrors(errors); 
    return Object.keys(errors).length === 0; 
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const isValid = validateForm(); 

    if (!isValid) {
      // Display a general alert only if there are formErrors
      if (Object.keys(formErrors).length > 0) {
        Swal.fire({
          icon: "error",
          title: "Validation Failed",
          html: Object.values(formErrors).join("<br>") || "Please correct the errors in the form.",
        });
      }
      return; 
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("company_name", formData.company_name);
      formDataToSend.append("team_size", formData.team_size);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("street_address", formData.street_address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state_province", formData.state_province);
      formDataToSend.append("zip_code", formData.zip_code);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("contact_number", formData.contact_number);

      // Append the company logo only if it exists and is valid
      if (formData.company_logo && formData.company_logo.length > 0 && formErrors.company_logo === null) {
        formDataToSend.append("company_logo", formData.company_logo[0]);
      } 

      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.tokens && data.tokens.access) {
        localStorage.setItem("token", data.tokens.access);

        localStorage.removeItem("is_superuser");
        localStorage.removeItem("is_company");

        if (data.is_superuser === true) {
          localStorage.setItem("is_superuser", "true");
        } else if (data.is_company === true) {
          localStorage.setItem("is_company", "true");
        }

        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your company has been registered.",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          navigate("/dashboard");
        });
      } else {
        const errorMessage =
          data.detail ||
          data.message ||
          "Registration failed. Please check your details.";
        Swal.fire({
          icon: "error",
          title: data.error,
          text: errorMessage,
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-['Poppins']">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-2xl border border-blue-200 transform transition-transform duration-300 ease-in-out hover:scale-[1.01]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-800 tracking-tight drop-shadow-md animate-fadeIn">
            ✨ Register Your Company
          </h2>
          <p className="text-gray-600 mt-2">
            Join us and streamline your company's operations!
          </p>
          <div className="w-20 h-1 bg-blue-500 mx-auto mt-4 rounded-full shadow-md"></div>
        </div>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="company_name"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              <span className="flex items-center">🏢 Company Name</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.company_name
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              } transition duration-200 text-gray-800 placeholder-gray-400`}
              placeholder="Your Company Inc."
            />
            {formErrors.company_name && (
              <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                {formErrors.company_name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="team_size"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              <span className="flex items-center">👥 Team Size</span>
            </label>
            <select
              id="team_size"
              name="team_size"
              value={formData.team_size}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 ${
                formErrors.team_size
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              } transition duration-200 text-gray-800`}
            >
              <option value="">Select Team Size</option>
              <option value="0-10">0-10 employees</option>
              <option value="11-20">11-20 employees</option>
              <option value="21-30">21-30 employees</option>
              <option value="30-50">30-50 employees</option>
              <option value="50+">50+ employees</option>
            </select>
            {formErrors.team_size && (
              <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                {formErrors.team_size}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900 mb-2 tracking-wide"
            >
              <span className="flex items-center">
                📧 Company Email Address
              </span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@yourcompany.com"
              className={`w-full px-4 py-3 text-[15px] rounded-xl shadow-sm transition-all duration-200 outline-none ${
                formErrors.email
                  ? "border border-red-500 focus:ring-2 focus:ring-red-300"
                  : "border border-gray-300 focus:ring-2 focus:ring-blue-400"
              } bg-white text-gray-800 placeholder-gray-400`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-2 animate-fadeIn">
                {formErrors.email}
              </p>
            )}
          </div>

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

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              <span className="flex items-center">🔒 Password</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.password
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              } transition duration-200 text-gray-800 placeholder-gray-400`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[43px] text-gray-500 hover:text-gray-700 transition-colors duration-200"
              tabIndex={-1}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                {formErrors.password}
              </p>
            )}
          </div>

          <div className="relative mt-4">
            <label
              htmlFor="confirm_password"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              <span className="flex items-center">🔐 Confirm Password</span>
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.confirm_password
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              } transition duration-200 text-gray-800 placeholder-gray-400`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[43px] text-gray-500 hover:text-gray-700 transition-colors duration-200"
              tabIndex={-1}
            >
              {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
            </button>
            {formErrors.confirm_password && (
              <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                {formErrors.confirm_password}
              </p>
            )}
          </div>

          <div className="">
            <label
              htmlFor="company_logo"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              📷 Company Logo
            </label>
            <FileUpload
              onFilesSelected={handleLogoUpload}
              currentFiles={formData.company_logo}
              error={formErrors.company_logo}
            />
            {formErrors.company_logo && (
              <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                {formErrors.company_logo}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="street_address"
                className="block text-gray-700 font-semibold mb-2 text-sm"
              >
                <span className="flex items-center">🏠 Street Address</span>
              </label>
              <input
                type="text"
                id="street_address"
                name="street_address"
                value={formData.street_address}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.street_address
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                } transition duration-200 text-gray-800 placeholder-gray-400`}
                placeholder="123 Main St"
              />
              {formErrors.street_address && (
                <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                  {formErrors.street_address}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-gray-700 font-semibold mb-2 text-sm"
              >
                <span className="flex items-center">🌆 City</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.city
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                } transition duration-200 text-gray-800 placeholder-gray-400`}
                placeholder="Anytown"
              />
              {formErrors.city && (
                <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                  {formErrors.city}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="state_province"
                className="block text-gray-700 font-semibold mb-2 text-sm"
              >
                <span className="flex items-center">🗺️ State / Province</span>
              </label>
              <input
                type="text"
                id="state_province"
                name="state_province"
                value={formData.state_province}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.state_province
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                } transition duration-200 text-gray-800 placeholder-gray-400`}
                placeholder="CA / Rajasthan"
              />
              {formErrors.state_province && (
                <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                  {formErrors.state_province}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="zip_code"
                className="block text-gray-700 font-semibold mb-2 text-sm"
              >
                <span className="flex items-center">📮 Zip / Postal Code</span>
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.zip_code
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                } transition duration-200 text-gray-800 placeholder-gray-400`}
                placeholder="90210 / 313001"
              />
              {formErrors.zip_code && (
                <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                  {formErrors.zip_code}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="country"
                className="block text-gray-700 font-semibold mb-2 text-sm"
              >
                <span className="flex items-center">🌍 Country</span>
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.country
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                } transition duration-200 text-gray-800 placeholder-gray-400`}
                placeholder="United States / India"
              />
              {formErrors.country && (
                <p className="text-red-500 text-xs mt-1 animate-fadeIn">
                  {formErrors.country}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
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
                Registering...
              </>
            ) : (
              "Register Company"
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
  Already have an account?{" "}
  <a
    href="/login"
    className="font-semibold text-blue-600 hover:text-blue-800 transition duration-200"
  >
    Login here
  </a>
</div>
      </div>
    </div>
  );
};

export default Register;