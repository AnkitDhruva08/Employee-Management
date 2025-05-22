import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Swal from 'sweetalert2';
const AddEmployee = () => {
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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState([]);
  // Headre Content for update/add
  let HedareContent = ''
  if (!id) {
    HedareContent = 'ADD NEW EMPLOYEE'
  }
  else {
    HedareContent = 'UPDATE EMPLOYEE RECORDS'
  }

  // button Text
  let buttonText = id? 'UPDATE' : 'ADD'

  // For Fetch The Employee Data
  useEffect(() => {
    if (id) {
      const fetchEmployee = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No auth token found");
          }
  
          const res = await fetch(`http://localhost:8000/api/employees/${id}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (!res.ok) throw new Error("Failed to fetch employee");
          const data = await res.json();
        
          setFormData({
            ...data,
            job_role: data.role_id
          });
          
        } catch (err) {
          console.error("Error loading employee:", err);
          setError("Failed to load employee data. Please login again.");
        }
      };
      fetchEmployee();
    }
  }, [id]);
  

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/roles/");
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Error loading roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized. Please login again.");
      return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `http://localhost:8000/api/employees/${id}/` : "http://localhost:8000/api/employees/";

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
        // Display Success Message
        Swal.fire({
          title: id ? "Updated!" : "Added!",
          text: id ? "Employee record has been updated." : "New employee has been added.",
          icon: "success",
          confirmButtonText: "OK",
        });

        // Reset form if adding a new employee
        if (!id) {
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
        }
      } else {
        const errorData = await response.json();
        setError(errorData?.error || "Operation failed.");
        Swal.fire({
          title: "Error!",
          text: errorData?.error || "Operation failed.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      setError("Server error");
      Swal.fire({
        title: "Error!",
        text: "There was a problem connecting to the server.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6 py-10 bg-white rounded-3xl shadow-xl border border-gray-200">
      <h2 className="text-4xl font-bold text-center text-blue-700 mb-12">{HedareContent}</h2>
      <form onSubmit={handleSubmit} className=" ax-w-[100rem]  mt-8space-y-10">
        <SectionTitle title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
          <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
          <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
          <Input label="Contact Number" name="contact_number" value={formData.contact_number} onChange={handleChange} />
          <Input label="Company Email" name="company_email" value={formData.company_email} onChange={handleChange} />
          <Input label="Personal Email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
          <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
          <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
          <Select label="Job Role" name="job_role" value={formData.job_role} onChange={handleChange} options={roles.map(r => ({ label: r.role_name, value: r.id }))} />
        </div>

        {error && <p className="text-red-500 font-medium text-center">{error}</p>}
        {success && <p className="text-green-600 font-medium text-center">{success}</p>}

        <div className="flex mt-4 justify-center">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-10 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
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
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
    >
      <option value="">-- Select --</option>
      {options.map((option) => (
        <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>
          {typeof option === 'string' ? option : option.label}
        </option>
      ))}
    </select>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2">{title}</h3>
);

export default AddEmployee;
