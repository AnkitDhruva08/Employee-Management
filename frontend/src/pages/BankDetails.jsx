import { useEffect, useState } from "react";
import {
  Upload, User, Banknote, Landmark,
  CreditCard, FileText, FileCheck
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const BankDetails = () => {
  const { id } = useParams();
  console.log('id ===>', id)
  const [bankData, setBankData] = useState({
    id: null, 
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    account_number: '',
    account_type: '',
    bank_details_pdf: null,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!id) return; 
      const token = localStorage.getItem("token");
  
      try {
        const response = await fetch(`http://localhost:8000/api/employee-bank-details/${id}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) throw new Error("Unauthorized or no data found");
  
        const data = await response.json();
        console.log('Bank detail data:', data);
  
        setBankData({
          ...data,
          bank_details_pdf: null, 
        });
        setIsUpdating(true);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsUpdating(true);
      }
    };
  
    fetchBankDetails();
  }, [id]);

  
  const handleChange = (e) => {
    setBankData({ ...bankData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setBankData({ ...bankData, bank_details_pdf: file || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    const method = isUpdating ? "PUT" : "POST";
    const formData = new FormData();

    try {
      Object.entries(bankData).forEach(([key, value]) => {
        if (key === 'bank_details_pdf' && value) {
          formData.append(key, value);
        } else if (key !== 'bank_details_pdf') {
          formData.append(key, value ?? '');
        }
      });

      const endpoint = isUpdating
        ? `http://localhost:8000/api/employee-bank-details/${id}/`
        : "http://localhost:8000/api/employee-bank-details/";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error("Failed to submit. " + (errData?.detail || `Status: ${response.status}`));
      }

      setSuccess(isUpdating ? "Bank details updated." : "Bank details added.");
      setIsUpdating(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-3xl mt-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8 tracking-wide">
        {isUpdating ? "Update Bank Details" : "Add Bank Details"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        {/* Input Fields */}
        {[
          { label: "Account Holder's Name", name: "account_holder_name", icon: <User className="w-5 h-5 text-blue-500" /> },
          { label: "Name of Bank", name: "bank_name", icon: <Banknote className="w-5 h-5 text-blue-500" /> },
          { label: "Branch Name", name: "branch_name", icon: <Landmark className="w-5 h-5 text-blue-500" /> },
          { label: "IFSC Code", name: "ifsc_code", icon: <FileText className="w-5 h-5 text-blue-500" /> },
          { label: "Account Number", name: "account_number", icon: <CreditCard className="w-5 h-5 text-blue-500" /> },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              {field.icon}
              <input
                type="text"
                name={field.name}
                value={bankData[field.name] || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
          </div>
        ))}

        {/* Account Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Types of Account
          </label>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            <select
              name="account_type"
              value={bankData.account_type || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white"
            >
              <option value="">Select Account Type</option>
              <option value="saving">Saving</option>
              <option value="salary">Salary</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attach PDF (Cancel Cheque) <span className="text-xs text-gray-400">(Optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            <input
              type="file"
              name="bank_details_pdf"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          {isUpdating ? "Update Details" : "Submit Details"}
        </button>
      </form>

      {/* Status Messages */}
      {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
    </div>
  );
};

export default BankDetails;
