import { useEffect, useState } from "react";
import FileUpload from "../File/FileUpload";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function OfficeDocumentsForm({ onNext, onPrev }) {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [existingDocs, setExistingDocs] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem("token");

  const fetchEmployeeDocuments = async () => {
    if (id) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/employee-documents/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setIsUpdating(false);
            setLoading(false);
            return;
          }
          throw new Error("Unauthorized or an error occurred while fetching documents.");
        }

        const data = await response.json();
        const doc = Array.isArray(data) && data.length > 0 ? data[0] : data;

        if (doc && Object.keys(doc).length > 0) {
          setEmployeeFormData((prev) => ({
            ...prev,
            insurance_number: doc.insurance_number || "",
            epf_member: doc.epf_member || "",
            uan: doc.uan || "",
            photo: null,
            aadhar: null,
            pan: null,
            dl: null,
            appointment: null,
            promotion: null,
            resume: null,
            esic_card: null,
          }));

          setExistingDocs({
            photo: doc.photo,
            aadhar: doc.aadhar,
            pan: doc.pan,
            dl: doc.dl,
            appointment: doc.appointment,
            promotion: doc.promotion,
            resume: doc.resume,
            esic_card: doc.esic_card,
          });

          setIsUpdating(true);
        } else {
          setIsUpdating(false);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to fetch existing documents.',
        });
      }
    } else {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        await fetchDashboardLink(token);
        await fetchDashboard(token);
        await fetchEmployeeDocuments();
      } catch (err) {
        setError("Failed to load necessary data or employee documents.");
        Swal.fire({
          icon: 'error',
          title: 'Initialization Error',
          text: 'Failed to load initial data. Please try refreshing.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployeeFormData({
      ...employeeFormData,
      [name]: value,
    });
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const validateFile = (file, fieldName, allowedTypes, errorMessage) => {
    if (!file) return true;

    const fileType = file.type;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    const isAllowed = allowedTypes.includes(fileType) || allowedTypes.some(type => fileExtension === type.split('/')[1]);

    if (!isAllowed) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: errorMessage,
      });
      setFormErrors((prevErrors) => ({ ...prevErrors, [fieldName]: errorMessage }));
      return false;
    }
    return true;
  };

  const handleFileChange = (fieldName, files) => {
    const selectedFile = files[0] instanceof File ? files[0] : files[0]?.file;
    
    let isValid = true;
    let errorMessage = "";
    let allowedTypes = [];

    if (fieldName === "photo") {
      allowedTypes = ["image/jpeg", "image/png"];
      errorMessage = "Photo can only be JPG or PNG.";
    } else if (["aadhar", "pan", "dl", "appointment", "promotion", "resume", "esic_card"].includes(fieldName)) {
      allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      errorMessage = `${fieldName.replace(/_/g, ' ').toUpperCase()} can only be JPG, PNG, or PDF.`;
    }

    if (selectedFile) {
      isValid = validateFile(selectedFile, fieldName, allowedTypes, errorMessage);
    }

    if (isValid) {
      setEmployeeFormData((prev) => ({
        ...prev,
        [fieldName]: selectedFile || null,
      }));
      setFormErrors((prevErrors) => ({ ...prevErrors, [fieldName]: "" }));
    } else {
      setEmployeeFormData((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  const handleFileDelete = (fieldName) => {
    setEmployeeFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    setExistingDocs((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [fieldName]: "" }));
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!employeeFormData.aadhar && !existingDocs.aadhar) {
      errors.aadhar = "Aadhar Card is required.";
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: errors.aadhar,
      });
      isValid = false;
    }
    if (!employeeFormData.pan && !existingDocs.pan) {
      errors.pan = "PAN Card is required.";
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: errors.pan,
      });
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // if (!validateForm()) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Validation Error',
    //     text: 'Please fill in all required fields and correct any file type errors.',
    //   });
    //   return;
    // }

    setLoading(true);

    try {
      const formData = new FormData();
      const method = isUpdating ? "PUT" : "POST";

      for (const key in employeeFormData) {
        const value = employeeFormData[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else if (
          typeof value === "string" &&
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          formData.append(key, value);
        }
      }

      if (isUpdating) {
        for (const fieldName of ['photo', 'aadhar', 'pan', 'dl', 'appointment', 'promotion', 'resume', 'esic_card']) {
          if (employeeFormData[fieldName] === null && existingDocs[fieldName]) {
            formData.append(`${fieldName}_deleted`, 'true');
          }
        }
      }
      
      const endpoint = isUpdating
        ? `http://localhost:8000/api/employee-documents/${id}/`
        : "http://localhost:8000/api/employee-documents/";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        const detailedError = errData?.error;
        Swal.fire({
          icon: 'error',
          title: 'Submission Error',
          text: errData.error,
        });
        throw new Error("Failed to submit: " + detailedError);
      }

      setSuccess("Documents submitted successfully!");
      setIsUpdating(true); 
      
      await fetchEmployeeDocuments(); 

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Documents submitted successfully.',
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        navigate("/profile-page");
      });

    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: err.message || 'An unexpected error occurred during submission.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading document data...</div>
      ) : (
        <div className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12">
          <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
            {isUpdating ? "Update Documents Details" : "Upload Documents Details"}
          </h2>

          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="insurance_number" className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  Insurance Number
                </label>
                <input
                  type="text"
                  id="insurance_number"
                  name="insurance_number"
                  value={employeeFormData.insurance_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="epf_member" className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  EPF Member
                </label>
                <input
                  type="text"
                  id="epf_member"
                  name="epf_member"
                  value={employeeFormData.epf_member}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="uan" className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  UAN
                </label>
                <input
                  type="text"
                  id="uan"
                  name="uan"
                  value={employeeFormData.uan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Photograph <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.photo
                      ? [`http://localhost:8000${existingDocs.photo}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png"
                  onFilesSelected={(files) => handleFileChange("photo", files)}
                  onDeletedFiles={() => handleFileDelete("photo")}
                />
                {formErrors.photo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.photo}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Aadhar Card *
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.aadhar
                      ? [`http://localhost:8000${existingDocs.aadhar}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("aadhar", files)}
                  onDeletedFiles={() => handleFileDelete("aadhar")}
                />
                {formErrors.aadhar && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.aadhar}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  PAN Card *
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.pan
                      ? [`http://localhost:8000${existingDocs.pan}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("pan", files)}
                  onDeletedFiles={() => handleFileDelete("pan")}
                />
                {formErrors.pan && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.pan}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Driving License <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.dl
                      ? [`http://localhost:8000${existingDocs.dl}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("dl", files)}
                  onDeletedFiles={() => handleFileDelete("dl")}
                />
                {formErrors.dl && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.dl}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Appointment Letter <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.appointment
                      ? [`http://localhost:8000${existingDocs.appointment}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("appointment", files)}
                  onDeletedFiles={() => handleFileDelete("appointment")}
                />
                {formErrors.appointment && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.appointment}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Promotion Letter <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.promotion
                      ? [`http://localhost:8000${existingDocs.promotion}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("promotion", files)}
                  onDeletedFiles={() => handleFileDelete("promotion")}
                />
                {formErrors.promotion && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.promotion}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Resume <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.resume
                      ? [`http://localhost:8000${existingDocs.resume}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("resume", files)}
                  onDeletedFiles={() => handleFileDelete("resume")}
                />
                {formErrors.resume && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.resume}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  ESIC Card <span className="text-xs text-gray-400"> (Optional)</span>
                </label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={
                    existingDocs.esic_card
                      ? [`http://localhost:8000${existingDocs.esic_card}`]
                      : []
                  }
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFilesSelected={(files) => handleFileChange("esic_card", files)}
                  onDeletedFiles={() => handleFileDelete("esic_card")}
                />
                {formErrors.esic_card && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.esic_card}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={onPrev}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Previous
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg transition duration-200"
              >
                {loading
                  ? "Processing..."
                  : isUpdating
                  ? "Update Details"
                  : "Submit Details"}
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