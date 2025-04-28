import { useEffect, useState } from "react";
import { Upload, User, Banknote, Landmark, CreditCard, FileText, FileCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';

import EmployeeSidebar from "../components/sidebar/EmployeeSidebar";
import Header from "../components/header/Header";
import { employeeDashboardLink, fetchDashboard } from "../utils/api";

const BankDetails = () => {
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

  const [quickLinks, setQuickLinks] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  const HeaderTitle = "Bank Details";

  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoading(true);
      let endpoint = 'http://localhost:8000/api/employee-bank-details/';

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch bank details");

        const data = await response.json();
        if (data && data.length > 0) {
          const bank = data[0];
          setBankData({
            id: bank.id,
            account_holder_name: bank.account_holder_name,
            bank_name: bank.bank_name,
            branch_name: bank.branch_name,
            ifsc_code: bank.ifsc_code,
            account_number: bank.account_number,
            account_type: bank.account_type,
            bank_details_pdf: null,
          });
          setIsUpdating(true);
        } else {
          setIsUpdating(false);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [id]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const links = await employeeDashboardLink(token);
        const dashboardData = await fetchDashboard(token);
        setQuickLinks(links);
        setDashboardData(dashboardData);
      } catch (err) {
        setError("Failed to load dashboard");
      }
    };

    fetchLinks();
  }, [token]);

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

    const formData = new FormData();
    Object.entries(bankData).forEach(([key, value]) => {
      if (key === 'bank_details_pdf' && value) {
        formData.append(key, value);
      } else if (key !== 'bank_details_pdf') {
        formData.append(key, value ?? '');
      }
    });

    try {
      const endpoint = isUpdating
        ? `http://localhost:8000/api/employee-bank-details/${bankData.id}/`
        : "http://localhost:8000/api/employee-bank-details/";

      const method = isUpdating ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit");
      }

      setSuccess(isUpdating ? "Bank details updated successfully." : "Bank details added successfully.");
      setIsUpdating(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center mt-10 text-xl animate-pulse">{error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold">{dashboardData?.company}</h2>
        <div className="flex justify-center mt-8">
          <EmployeeSidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg mt-6">
          <h2 className="text-2xl font-semibold text-center mb-6 text-blue-700">
            {isUpdating ? "Update Your Bank Details" : "Add Your Bank Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Input Fields */}
            {[
              { label: "Account Holder Name", name: "account_holder_name", icon: <User /> },
              { label: "Bank Name", name: "bank_name", icon: <Banknote /> },
              { label: "Branch Name", name: "branch_name", icon: <Landmark /> },
              { label: "IFSC Code", name: "ifsc_code", icon: <FileText /> },
              { label: "Account Number", name: "account_number", icon: <CreditCard /> },
            ].map(({ label, name, icon }) => (
              <div key={name}>
                <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-2">
                  {icon}
                  <input
                    type="text"
                    name={name}
                    value={bankData[name]}
                    onChange={handleChange}
                    required
                    className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            ))}

            {/* Account Type */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Account Type</label>
              <div className="flex items-center gap-2">
                <FileCheck />
                <select
                  name="account_type"
                  value={bankData.account_type}
                  onChange={handleChange}
                  required
                  className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">Select</option>
                  <option value="saving">Saving</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
            </div>

            {/* Upload PDF */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Attach PDF (Optional)</label>
              <div className="flex items-center gap-2">
                <Upload />
                <input
                  type="file"
                  name="bank_details_pdf"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md"
            >
              {isUpdating ? "Update Details" : "Submit Details"}
            </button>

            {/* Status Messages */}
            {success && <p className="text-green-600 text-center mt-4">{success}</p>}
            {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BankDetails;
