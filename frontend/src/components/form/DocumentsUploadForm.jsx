import { useEffect, useState } from "react";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import FileUpload from "../File/FileUpload";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import { useNavigate, useParams } from "react-router-dom";

export default function OfficeDocumentsForm({ onNext, onPrev }) {

  const { id } = useParams();
  const navigate = useNavigate()

  const [employeeFormData, setEmployeeFormData] = useState({
    id: null,
    photo: null,
    aadhar: null,
    pan: null,
    dl: null,
    appointment: null,
    promotion: null,
    resume: null,
    esic_card: null,
    insurance_number: "",
    epf_member: "",
    uan: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  const token = localStorage.getItem("token");
  const headerTitle = 'Employee Documents'

  const fetchEmployeeDocuments = async () => {
    if(id){
      try {
        const response = await fetch(
          `http://localhost:8000/api/employee-documents/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Unauthorized or no data found");
  
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const doc = data[0];
          setEmployeeFormData({
            ...doc,
            photo: null,
            aadhar: null,
            pan: null,
            dl: null,
            appointment: null,
            promotion: null,
            resume: null,
            esic_card: null,
          });
          setIsUpdating(true);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  
  };

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
    fetchEmployeeDocuments();
  }, [token]);

  const handleChange = (e) => {
    setEmployeeFormData({
      ...employeeFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      const method = isUpdating ? "PUT" : "POST";

      for (const key in employeeFormData) {
        if (employeeFormData[key]) {
          formData.append(key, employeeFormData[key]);
        }
      }

      const endpoint = isUpdating
        ? `http://localhost:8000/api/employee-documents/${id}/`
        : "http://localhost:8000/api/employee-documents/";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          "Failed to submit. " +
            (errData?.detail || `Status: ${response.status}`)
        );
      }

      // setSuccess("Documents updated successfully.");
      setIsUpdating(true);
      navigate('/profile-page')
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewFile = (filePath) => {
    if (filePath) {
      const url = `http://localhost:8000${filePath}`;
      window.open(url, "_blank");
    }
  };

  const fileFields = [
    { name: "photo", label: "Photograph", accept: ".jpg,.jpeg,.png" },
    { name: "aadhar", label: "Aadhar Card", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "pan", label: "PAN Card", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "dl", label: "Driving License", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "appointment", label: "Appointment Letter", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "promotion", label: "Promotion Letter", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "resume", label: "Resume", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "esic_card", label: "ESIC Card", accept: ".jpg,.jpeg,.png,.pdf" },
  ];

  return (
 


<div className="max-w-7xl mx-auto">

{loading ? (
  <div className="text-center py-10 text-gray-500">Loading...</div>
) : (
  <div className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12">
    <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
      {isUpdating ? "Update Documents Details" : "Upload Documents Details"}
    </h2>

    <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InputField
            label="Insurance Number"
            name="insurance_number"
            value={employeeFormData.insurance_number}
            onChange={handleChange}
          />
          <InputField
            label="EPF Member"
            name="epf_member"
            value={employeeFormData.epf_member}
            onChange={handleChange}
          />
          <InputField
            label="UAN"
            name="uan"
            value={employeeFormData.uan}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fileFields.map((field) => (
            <div key={field.name}>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {field.label} <span className="text-xs text-gray-400">(Optional)</span>
              </label>
              <FileUpload
                isView={false}
                isCombine={false}
                initialFiles={
                  employeeFormData[field.name] ? [employeeFormData[field.name]] : []
                }
                onFilesSelected={(files) => {
                  setEmployeeFormData((prev) => ({
                    ...prev,
                    [field.name]: files[0]?.file || null,
                  }));
                }}
                onDeletedFiles={() =>
                  setEmployeeFormData((prev) => ({
                    ...prev,
                    [field.name]: null,
                  }))
                }
                onPreviewFile={handlePreviewFile}
              />
            </div>
          ))}
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
            onClick={handleSubmit} 
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg"
          >
            {loading ? "Uploading..." : isUpdating ? "Update Details" : "Submit Details"}
          </button>
        </div>

        {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
      </div>
  </div>
)}
</div>
  );
}

// Reusable Input Field
const InputField = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
    />
  </div>
);
