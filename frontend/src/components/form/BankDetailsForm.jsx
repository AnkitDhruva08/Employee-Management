import { useEffect, useState } from "react";
import { Upload, User, Banknote, Landmark, CreditCard, FileText, FileCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import FileUpload from "../File/FileUpload";
import Swal from "sweetalert2";
import Header from "../header/Header";

export default function BankDetailsForm({ onNext, onPrev }) {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const [bankData, setBankData] = useState({
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    account_number: '',
    account_type: '',
    bank_details_pdf: null,
  });

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [existingData, setExistingData] = useState(null);
  const [empId, setId] = useState(null);


  const headerTitle = "Bank Details";

  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoading(true);
      if(id){
        try {
          const response = await fetch("http://localhost:8000/api/employee-bank-details/", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (!response.ok) throw new Error("Failed to fetch bank details");
          const data = await response.json();
  
          if (data?.length > 0) {
            const bank = data[0];
            setBankData({
              id: bank.id,
              account_holder_name: bank.account_holder_name || '',
              bank_name: bank.bank_name || '',
              branch_name: bank.branch_name || '',
              ifsc_code: bank.ifsc_code || '',
              account_number: bank.account_number || '',
              account_type: bank.account_type || '',
              bank_details_pdf: bank.bank_details_pdf || null,
            });
            setIsUpdating(true);
            setId(bank.id);
          }
  
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
  
    };

    fetchBankDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    Object.entries(bankData).forEach(([key, value]) => {
      if (key === "bank_details_pdf" && value instanceof File) {
        formData.append(key, value);
      } else if (key !== "bank_details_pdf") {
        formData.append(key, value ?? '');
      }
    });

    const endpoint = isUpdating
      ? `http://localhost:8000/api/employee-bank-details/${id}/`
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

      if (onNext) onNext();

      setSuccess(isUpdating ? "Bank details saved successfully." : "Bank details saved successfully.");
      setIsUpdating(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreviewFile = () => {
    if (bankData.bank_details_pdf) {
      const fileUrl = `http://localhost:8000/apip${bankData.bank_details_pdf}`;
      window.open(fileUrl, "_blank");
    } else {
      alert("No file available for preview.");
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading...</div>;
  }

  return (



<div className="max-w-7xl mx-auto">

{loading ? (
  <div className="text-center py-10 text-gray-500">Loading...</div>
) : (
  <div className="mt-8 bg-white shadow-xl border border-gray-200 rounded-3xl px-10 py-12">
    <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
      {isUpdating ? "Update Bank Details" : "Add Bank Details"}
    </h2>

    <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "Account Holder Name", name: "account_holder_name", icon: <User /> },
            { label: "Bank Name", name: "bank_name", icon: <Banknote /> },
            { label: "Branch Name", name: "branch_name", icon: <Landmark /> },
            { label: "IFSC Code", name: "ifsc_code", icon: <FileText /> },
            { label: "Account Number", name: "account_number", icon: <CreditCard /> },
            {
              label: "Account Type",
              name: "account_type",
              icon: <FileCheck />,
              isSelect: true,
              options: [
                { value: "", label: "Select" },
                { value: "saving", label: "Saving" },
                { value: "salary", label: "Salary" }
              ]
            }
          ].map(({ label, name, icon, isSelect, options }) => (
            <div key={name}>
              <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
              <div className="flex items-center gap-2">
                {icon}
                {isSelect ? (
                  <select
                    name={name}
                    value={bankData[name]}
                    onChange={handleChange}
                    required
                    className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name={name}
                    value={bankData[name]}
                    onChange={handleChange}
                    required
                    className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Attach PDF (Optional)</label>
          <FileUpload
            isView={false}
            isCombine={false}
            initialFiles={bankData.bank_details_pdf ? [bankData.bank_details_pdf] : []}
            onFilesSelected={(files) =>
              setBankData((prev) => ({ ...prev, bank_details_pdf: files[0]?.file || null }))
            }
            onDeletedFiles={() =>
              setBankData((prev) => ({ ...prev, bank_details_pdf: null }))
            }
            onPreviewFile={handlePreviewFile}
          />
        </div>

             {/* Navigation Buttons */}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? "Submitting..." : isUpdating ? "Next" : "Next"}
            </button>
          </div>

        {/* Status Messages */}
        {success && <p className="text-green-600 text-center mt-4">{success}</p>}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
  </div>
)}
</div>
  );
}
