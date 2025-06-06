import { useEffect, useState } from "react";
import {
  User,
  Banknote,
  Landmark,
  CreditCard,
  FileText,
  FileCheck,
} from "lucide-react";
import { useParams } from "react-router-dom";
import FileUpload from "../File/FileUpload";
import Header from "../header/Header";

export default function BankDetailsForm({ onNext, onPrev }) {
  const token = localStorage.getItem("token");
  const { id } = useParams();

  const [bankData, setBankData] = useState({
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
    ifsc_code: "",
    account_number: "",
    account_type: "",
    bank_details_pdf: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!bankData.account_holder_name) newErrors.account_holder_name = "Required";
    if (!bankData.bank_name) newErrors.bank_name = "Required";
    if (!bankData.branch_name) newErrors.branch_name = "Required";
    if (!bankData.ifsc_code) newErrors.ifsc_code = "Required";
    if (!bankData.account_number) {
      newErrors.account_number = "Required";
    } else if (
      bankData.account_number.length < 9 ||
      bankData.account_number.length > 18
    ) {
      newErrors.account_number = "Account number must be 9–18 digits";
    }
    if (!bankData.account_type) newErrors.account_type = "Select account type";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoading(true);
      if (id) {
        try {
          const response = await fetch(
            "http://localhost:8000/api/employee-bank-details/",
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch bank details");
          const data = await response.json();

          if (data?.length > 0) {
            const bank = data[0];
            setBankData({
              id: bank.id,
              account_holder_name: bank.account_holder_name || "",
              bank_name: bank.bank_name || "",
              branch_name: bank.branch_name || "",
              ifsc_code: bank.ifsc_code || "",
              account_number: bank.account_number || "",
              account_type: bank.account_type || "",
              bank_details_pdf: bank.bank_details_pdf || null,
            });
            setIsUpdating(true);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData();

    Object.entries(bankData).forEach(([key, value]) => {
      if (key === "bank_details_pdf") {
        if (value instanceof File) {
          console.log("Appending file to form data:", value);
          formData.append(key, value);
        }
      } else {
        formData.append(key, value ?? "");
      }
    });

    const endpoint = isUpdating
      ? `http://localhost:8000/api/employee-bank-details/${bankData.id || id}/`
      : "http://localhost:8000/api/employee-bank-details/";

    const method = isUpdating ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Failed to submit bank details");
      }

      setSuccess("Bank details saved successfully.");
      setIsUpdating(true);
      console.log("Form submission successful");
      if (onNext) onNext();
    } catch (err) {
      setError(err.message);
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewFile = () => {
    if (bankData.bank_details_pdf) {
      let fileUrl = "";

      if (bankData.bank_details_pdf instanceof File) {
        // File object from input, create URL object for preview
        fileUrl = URL.createObjectURL(bankData.bank_details_pdf);
        console.log("Previewing local file:", fileUrl);
      } else if (typeof bankData.bank_details_pdf === "string") {
        // URL string from backend
        fileUrl = `http://localhost:8000${bankData.bank_details_pdf}`;
        console.log("Previewing remote file:", fileUrl);
      }

      window.open(fileUrl, "_blank");
    } else {
      alert("No file available for preview.");
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-2xl rounded-3xl">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        {isUpdating ? "Update Bank Details" : "Add Bank Details"}
      </h2>

      <div  className="space-y-8" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Account Holder Name", name: "account_holder_name", icon: <User /> },
            { label: "Bank Name", name: "bank_name", icon: <Banknote /> },
            { label: "Branch Name", name: "branch_name", icon: <Landmark /> },
            { label: "IFSC Code", name: "ifsc_code", icon: <FileText /> },
            { label: "Account Number", name: "account_number", icon: <CreditCard /> },
          ].map(({ label, name, icon }) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                {label}
              </label>
              <div className="flex items-center gap-2">
                {icon}
                <input
                  id={name}
                  type="text"
                  name={name}
                  value={bankData[name]}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 border rounded-lg w-full focus:outline-none ${
                    errors[name] ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors[name] && (
                <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
              )}
            </div>
          ))}

          {/* Account Type */}
          <div>
            <label
              htmlFor="account_type"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Account Type
            </label>
            <div className="flex items-center gap-2">
              <FileCheck />
              <select
                id="account_type"
                name="account_type"
                value={bankData.account_type}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none ${
                  errors.account_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select</option>
                <option value="saving">Saving</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            {errors.account_type && (
              <p className="text-sm text-red-500 mt-1">{errors.account_type}</p>
            )}
          </div>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Attach PDF (Optional)
          </label>
          <FileUpload
            isView={false}
            isCombine={false}
            initialFiles={
              bankData.bank_details_pdf
                ? [
                    typeof bankData.bank_details_pdf === "string"
                      ? { url: `http://localhost:8000${bankData.bank_details_pdf}`, name: "BankDetails.pdf" }
                      : { file: bankData.bank_details_pdf, name: bankData.bank_details_pdf.name },
                  ]
                : []
            }
            onFilesSelected={(files) => {
              console.log("Files selected:", files);
              if (files.length > 0) {
                setBankData((prev) => ({
                  ...prev,
                  bank_details_pdf: files[0].file || null,
                }));
              }
            }}
            onDeletedFiles={() => {
              console.log("Files deleted");
              setBankData((prev) => ({ ...prev, bank_details_pdf: null }));
            }}
            onPreviewFile={handlePreviewFile}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Previous
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Submitting..." : "Next"}
          </button>
        </div>

        {/* Messages */}
        {success && <p className="text-green-600 text-center mt-4">{success}</p>}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
