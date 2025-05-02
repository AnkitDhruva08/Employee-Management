import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import FileUpload from "../components/File/FileUpload";

const EmployeeDocuments = () => {
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
  const [existingData, setExistingData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const token = localStorage.getItem("token");
  const HeaderTitle = "Eployee Documents Details";

  //  Apfunction for Fetch Employee Documents Data
  const fetchEmployeeDocuments = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/employee-documents",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    fetchEmployeeDocuments();
  }, [token]);

  // Function for handle changes of input field
  const handleChange = (e) => {
    setEmployeeFormData({
      ...employeeFormData,
      [e.target.name]: e.target.value,
    });
  };

  // Function for handle file upload
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setEmployeeFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  // Function for handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      const method = isUpdating ? "PUT" : "POST";

      for (const key in employeeFormData) {
        if (employeeFormData[key]) formData.append(key, employeeFormData[key]);
      }

      const endpoint = isUpdating
        ? `http://localhost:8000/api/employee-documents/${employeeFormData.id}/`
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

      setSuccess("Documents uploaded successfully.");
      setIsUpdating(true);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePreviewFile = (filePath) => {
    if (filePath) {
      console.log("Previewing file:", filePath);
      const url = `http://localhost:8000${filePath}`;
      window.open(url, "_blank");
    }
  };

  const fileFields = [
    { name: "photo", label: "Photograph", accept: ".jpg,.jpeg,.png" },
    { name: "aadhar", label: "Aadhar Card", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "pan", label: "PAN Card", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "dl", label: "Driving License", accept: ".jpg,.jpeg,.png,.pdf" },
    {
      name: "appointment",
      label: "Appointment Letter",
      accept: ".jpg,.jpeg,.png,.pdf",
    },
    {
      name: "promotion",
      label: "Promotion Letter",
      accept: ".jpg,.jpeg,.png,.pdf",
    },
    { name: "resume", label: "Resume", accept: ".jpg,.jpeg,.png,.pdf" },
    { name: "esic_card", label: "ESIC Card", accept: ".jpg,.jpeg,.png,.pdf" },
  ];

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
          <div className="space-y-6">
            {/* Input Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Number
              </label>
              <input
                type="text"
                name="insurance_number"
                value={employeeFormData.insurance_number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EPF Member
              </label>
              <input
                type="text"
                name="epf_member"
                value={employeeFormData.epf_member}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UAN
              </label>
              <input
                type="text"
                name="uan"
                value={employeeFormData.uan}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            {/* File Upload Fields */}
            {fileFields.map((field) => (
              <div key={field.name}>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  {field.label}{" "}
                  <span className="text-xs text-gray-400">(Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    employeeFormData[field.name]
                      ? [employeeFormData[field.name]]
                      : []
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

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md"
            >
              {isUpdating ? "Update Details" : "Submit Details"}
            </button>

            {/* Status Messages */}
            {error && (
              <p className="text-red-600 mt-4 text-sm text-center">{error}</p>
            )}
            {success && (
              <p className="text-green-600 mt-4 text-sm text-center">
                {success}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocuments;
