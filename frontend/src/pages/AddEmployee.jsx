import React, { useState, useEffect } from "react";

const AddEmployee = () => {
  const [formData, setFormData] = useState({
      // Employee Details
      first_name: "",
      middle_name: "",
      last_name: "",
      contact_number: "",
      company_email: "",
      personal_email: "",
      date_of_birth: "", 
      gender: "",


  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/roles-dropdown/");
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Error loading roles:", err);
      }
    };
    fetchRoles();
  }, []);


  const handleChange = async (e) => {
    const { name, type, value } = e.target;
        setFormData({
        ...formData,
        [name]: value,
      });
    
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem('token');
    console.log('token ==<<>>>', token);
    if (!token) {
      setError("Unauthorized. Please login again.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });
    console.log('formData ===<<>>', formData)

    try {
      const response = await fetch("http://localhost:8000/api/employees/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
 
        body: JSON.stringify(formData)
      });

      console.log('response ==<<>>', response);
      if (response.ok) {
        setSuccess("Employee added successfully!");
        setFormData({}); // reset form
      } else {
        const errorData = await response.json();
        setError(errorData?.error || "Failed to add employee");
      }
    } catch (err) {
      console.error("Server error", err);
      setError("Server error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-4xl font-extrabold text-blue-600 mb-10 text-center drop-shadow-sm">
        Add New Employee
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Personal Details */}
        <SectionTitle title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
          <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
          <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
          <Input label="Contact Number" name="contact_number" value={formData.contact_number} onChange={handleChange} />
          <Input label="Company Email" name="company_email" value={formData.company_email} onChange={handleChange} />
          <Input label="Personal Email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
          <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
          <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Role</label>
          <select
            name="Designation"
            value={formData.job_role}
            onChange={handleChange}
            className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Select Role --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        </div>

        {/* Roles Dropdown */}
        {error && <p className="text-red-500 font-medium">{error}</p>}
        {success && <p className="text-green-600 font-medium">{success}</p>}

        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:scale-105 transition-transform">
          Add Employee
        </button>
      </form>
    </div>
  );
};

// 👇 Shared Components

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">-- Select --</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="text-2xl font-semibold text-gray-800 mt-10 mb-4 border-b pb-2">{title}</h3>
);

export default AddEmployee;
