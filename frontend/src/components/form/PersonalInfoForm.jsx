import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import Header from "../header/Header";

export default function PersonalInfoForm({ onNext, onPrev }) {

  const { id } = useParams();
  console.log('id ==<<<>>', id)
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

  const [roles, setRoles] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerContent, setHeaderContent] = useState("Loading...");
  const [buttonText, setButtonText] = useState("Loading...");
  const [empId, setId] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);

  const role_id = localStorage.getItem("role_id");
  const headerTitle = "Employee Personal Details";


  const fetchEmployee = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized. Please login again.");
      return;
    }
    if(id){
      try {
        const response = await fetch(`http://localhost:8000/api/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        if (!response.ok) throw new Error("Failed to fetch employee");
    
        const emp = await response.json();
    
        if (emp && emp.id) {
          setHeaderContent("UPDATE EMPLOYEE RECORDS");
          setButtonText("UPDATE");
          setIsRestricted(role_id === "3");
          setId(emp.id);
          setIsUpdating(true);
        } else {
          setHeaderContent("ADD NEW EMPLOYEE");
          setIsUpdating(false);
        }
    
        setFormData({
          first_name: emp.first_name || "",
          middle_name: emp.middle_name || "",
          last_name: emp.last_name || "",
          contact_number: emp.contact_number || "",
          company_email: emp.company_email || "",
          personal_email: emp.personal_email || "",
          date_of_birth: emp.date_of_birth || "",
          gender: emp.gender || "",
          job_role: emp.role_id || "",
        });
    
        setExistingData(emp);
      } catch (err) {
        console.error("Error loading employee:", err);
        setHeaderContent("ADD NEW EMPLOYEE");
        setButtonText("ADD");
  
        setError("Failed to load employee data.");
      } finally {
        setLoading(false);
      }
    }
   
  };
  
  

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

  useEffect(() => {
    
    fetchRoles();
    fetchEmployee();
  }, []);

  // if (loading) return <div>Loading...</div>;

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
    console.log('url ===>', url)

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
        if (onNext) onNext();
      
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
    <div className="max-w-7xl mx-auto">
      <Header title={headerTitle} />
  
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div
          className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12"
        >
          <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
            {headerContent}
          </h2>
  
          <div className="space-y-12">
            <div>
              <SectionTitle title="Personal Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
                <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
                <Input label="Contact Number" name="contact_number" value={formData.contact_number} onChange={handleChange} />
                <Input label="Company Email" name="company_email" value={formData.company_email} onChange={handleChange} disabled={isRestricted} />
                <Input label="Personal Email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
                <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                <Select label="Job Role" name="job_role" value={formData.job_role} onChange={handleChange} options={roles.map(r => ({ label: r.role_name, value: r.id }))} disabled={isRestricted} />
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
                 onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {id ? "Next" : "Next"}
              </button>
            </div>
  
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {success && <p className="text-center text-green-600 font-semibold">{success}</p>}
          </div>
        </div>
      )}
    </div>
  );
  
};
const Input = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>
);


const Select = ({ label, name, value, onChange, options, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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

