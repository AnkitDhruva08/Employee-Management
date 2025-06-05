import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/File/FileUpload";
import PhoneInput from "react-phone-input-2";

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
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    sessionStorage.clear();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
    if (name === "password" && formErrors.confirm_password) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: null,
      }));
    }
  };

  const handlePhoneChange = (value, country, e, formattedValue) => {
    setFormData({ ...formData, contact_number: value });
    if (formErrors?.contact_number) {
      setFormErrors((prevErrors) => ({ ...prevErrors, contact_number: null }));
    }
  };

  const handleLogoUpload = (files) => {
    setFormData((prevData) => ({
      ...prevData,
      company_logo: files && files.length > 0 ? files : null,
    }));
    if (formErrors?.company_logo) {
      setFormErrors((prevErrors) => ({ ...prevErrors, company_logo: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.company_name.trim()) {
      errors.company_name = "Company name is required.";
    } else if (formData.company_name.trim().length < 3) {
      errors.company_name = "Company name must be at least 3 characters long.";
    }

    if (!formData.team_size) {
      errors.team_size = "Team size is required.";
    }

    // Email validation without regex
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else {
      const atIndex = formData.email.indexOf("@");
      const dotIndex = formData.email.lastIndexOf(".");
      if (
        atIndex < 1 ||
        dotIndex < atIndex + 2 ||
        dotIndex === formData.email.length - 1 ||
        formData.email.split("@").length !== 2
      ) {
        errors.email = "Invalid email format.";
      }
    }

    // Contact number validation without regex (already handled by numericValue in handlePhoneChange)
    if (!formData.contact_number.trim()) {
      errors.contact_number = "Contact number is required.";
    } else if (formData.contact_number.length < 10) {
      errors.contact_number = "Contact number must be at least 10 digits long.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else {
      let hasUpper = false;
      let hasLower = false;
      let hasDigit = false;
      let hasSpecial = false;

      for (let i = 0; i < formData.password.length; i++) {
        const char = formData.password[i];
        if (char >= "A" && char <= "Z") {
          hasUpper = true;
        } else if (char >= "a" && char <= "z") {
          hasLower = true;
        } else if (char >= "0" && char <= "9") {
          hasDigit = true;
        } else if ("!@#$%^&*()_+-=[]{};':\"\\|,.<>/?~".includes(char)) {
          hasSpecial = true;
        }
      }

      if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        errors.password =
          "Password must include uppercase, lowercase, number, and special character.";
      }
    }

    if (!formData.confirm_password) {
      errors.confirm_password = "Confirm password is required.";
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match.";
    }

    if (!formData.street_address.trim()) {
      errors.street_address = "Street address is required.";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required.";
    }
    if (!formData.state_province.trim()) {
      errors.state_province = "State/Province is required.";
    }

    if (!formData.zip_code.trim()) {
      errors.zip_code = "Zip/Postal code is required.";
    } else {
      // Check if zip_code contains only digits
      let isNumeric = true;
      for (let i = 0; i < formData.zip_code.length; i++) {
        const char = formData.zip_code[i];
        if (char < "0" || char > "9") {
          isNumeric = false;
          break;
        }
      }
      if (
        !isNumeric ||
        formData.zip_code.length < 5 ||
        formData.zip_code.length > 10
      ) {
        errors.zip_code = "Zip/Postal code must be 5–10 digits.";
      }
    }

    if (!formData.country.trim()) {
      errors.country = "Country is required.";
    }

    // if (!formData.company_logo) {
    //   errors.company_logo = 'Company logo is required.';
    // } else if (formData.company_logo.length > 1) {
    //   errors.company_logo = 'Please upload only one logo.';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setApiError(null);

    const isValid = validateForm();

    if (isValid) {
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
        if (formData.company_logo && formData.company_logo.length > 0) {
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

          navigate("/dashboard");
        } else {
          setApiError(
            data.detail ||
              data.message ||
              "Registration failed. Please check your details."
          );
        }
      } catch (err) {
        console.error("Registration error:", err);
        setApiError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
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
              {showPassword ? "🚫" : "👁️"}
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
              {showConfirmPassword ? "🚫" : "👁️"}
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

          {apiError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative transition-all duration-300 animate-fadeIn"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{apiError}</span>
            </div>
          )}

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
      </div>
    </div>
  );
};

export default Register;
