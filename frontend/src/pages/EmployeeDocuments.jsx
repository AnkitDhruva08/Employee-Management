import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

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
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEmployeeDocuments = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/employee-documents", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("api result :", response);
        if (!response.ok) throw new Error("Unauthorized or no data found");

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const doc = data[0];
          setEmployeeFormData({ ...doc, photo: null, aadhar: null, pan: null, dl: null, appointment: null, promotion: null, resume: null, esic_card: null });
          setIsUpdating(true);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEmployeeDocuments();
  }, [token]);

  const handleChange = (e) => {
    setEmployeeFormData({ ...employeeFormData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      console.log(`${name} file selected:`, files[0]);
      setEmployeeFormData(prev => ({ ...prev, [name]: files[0] }));
    }
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
      console.log("api result :", response);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error("Failed to submit. " + (errData?.detail || `Status: ${response.status}`));
      }

      setSuccess("Documents uploaded successfully.");
      setIsUpdating(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
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
    <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-3xl mt-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8 tracking-wide">
        {isUpdating ? "Update Employee Documents" : "Upload Employee Documents"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        {/* Input Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">EPF Member</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">UAN</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              <input
                type="file"
                name={field.name}
                accept={field.accept}
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          {loading ? "Submitting..." : isUpdating ? "Update Documents" : "Upload Documents"}
        </button>

        {/* Status Messages */}
        {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
      </form>
    </div>
  );
};

export default EmployeeDocuments;
