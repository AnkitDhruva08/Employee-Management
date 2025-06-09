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
import Swal from 'sweetalert2';

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
    bankPdf: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/pdf"];
  const allowedPdfType = "application/pdf";
  const allowedFileTypes = [...allowedImageTypes, allowedPdfType];

  const validate = () => {
    const newErrors = {};
    if (!bankData.account_holder_name.trim()) newErrors.account_holder_name = "Account Holder Name is required.";
    if (!bankData.bank_name.trim()) newErrors.bank_name = "Bank Name is required.";
    if (!bankData.branch_name.trim()) newErrors.branch_name = "Branch Name is required.";
    if (!bankData.ifsc_code.trim()) newErrors.ifsc_code = "IFSC Code is required.";
    if (!bankData.account_number.trim()) {
      newErrors.account_number = "Account Number is required.";
    } else if (
      bankData.account_number.length < 9 ||
      bankData.account_number.length > 18 ||
      !/^\d+$/.test(bankData.account_number)
    ) {
      newErrors.account_number = "Account number must be 9–18 digits.";
    }
    if (!bankData.account_type) newErrors.account_type = "Please select an account type.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchBankDetails = async () => {
    setLoading(true);
    if (id) {
      try {
        const response = await fetch(
          "http://localhost:8000/api/employee-bank-details/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch bank details.");
        const data = await response.json();
        console.log('data ==<<>>', data)

        if (data?.length > 0) {
          const bank = data[0];
          console.log('data ankit ==<<>>', data.bank_details_pdf)
          setBankData({
            id: bank.id,
            account_holder_name: bank.account_holder_name || "",
            bank_name: bank.bank_name || "",
            branch_name: bank.branch_name || "",
            ifsc_code: bank.ifsc_code || "",
            account_number: bank.account_number || "",
            account_type: bank.account_type || "",
            bankPdf: data[0].bank_details_pdf || null,
          });
          setIsUpdating(true);
        }
      } catch (err) {
        setApiError(err.message);
        Swal.fire('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };


    
  const handleFileChange = (files) => {
    console.log("Selected files:", files);
    console.log("First file:", files[0]);
    setBankData({
      ...bankData,
      bankPdf: files.length > 0 ? files[0] : null,
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
      });
      return;
    }

    setApiError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData();

// Append text fields
formData.append("account_holder_name", bankData.account_holder_name);
formData.append("bank_name", bankData.bank_name);
formData.append("branch_name", bankData.branch_name);
formData.append("ifsc_code", bankData.ifsc_code);
formData.append("account_number", bankData.account_number);
formData.append("account_type", bankData.account_type);

// Append file if present
if (bankData.bankPdf instanceof File) {
  formData.append("bank_details_pdf", bankData.bankPdf); 
}

    console.log('formdata ==<<>>', formData)
    const endpoint = isUpdating
      ? `http://localhost:8000/api/employee-bank-details/${bankData.id}/`
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
        throw new Error(errorData?.detail || JSON.stringify(errorData) || "Failed to submit bank details.");
      }

      const responseData = await response.json();
      setSuccess("Bank details saved successfully!");
      setIsUpdating(true);
      setBankData(prev => ({
        ...prev,
        id: responseData.id || prev.id,
        bankPdf: null,
      }));

      if (onNext) onNext();
    } catch (err) {
      setApiError(err.message);
      Swal.fire('Submission Error', err.message, 'error');
      console.error("❌ Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">
        Loading bank details...
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
            {
              label: "Account Holder Name",
              name: "account_holder_name",
              icon: <User />,
            },
            { label: "Bank Name", name: "bank_name", icon: <Banknote /> },
            { label: "Branch Name", name: "branch_name", icon: <Landmark /> },
            { label: "IFSC Code", name: "ifsc_code", icon: <FileText /> },
            {
              label: "Account Number",
              name: "account_number",
              icon: <CreditCard />,
            },
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

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Attach Bank Proof (PDF/Image)
          </label>
   

          <FileUpload
            isView={false}
            isCombine={false}
            initialFiles={
              bankData.bankPdf ? [bankData.bankPdf] : []
            }
            
            onFilesSelected={handleFileChange}
          />
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            Previous
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Next"}
          </button>
        </div>

        {success && (
          <p className="text-green-600 text-center mt-4">{success}</p>
        )}
        {apiError && (
          <p className="text-red-600 text-center mt-4">{apiError}</p>
        )}
      </div>
    </div>
  );
}
