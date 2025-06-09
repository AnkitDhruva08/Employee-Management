import { useEffect, useState } from "react";
import { User, Banknote, Landmark, CreditCard, FileText, FileCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Header from "../components/header/Header";
import FileUpload from "../components/File/FileUpload";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import Swal from 'sweetalert2';

const BankDetails = () => {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [bankData, setBankData] = useState({
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    account_number: '',
    account_type: '',
    bank_details_pdf: null,
    bank_details_pdf_url: null,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
  const allowedPdfType = "application/pdf";
  const allowedTypes = [...allowedImageTypes, allowedPdfType];

  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoading(true);
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
            bank_details_pdf: null,
            bank_details_pdf_url: bank.bank_details_pdf || null,
          });
          setIsUpdating(true);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [id, token]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const links = await fetchDashboardLink(token);
        const dashboard = await fetchDashboard(token);
        setQuickLinks(links);
        setDashboardData(dashboard);
      } catch (err) {
        setError("Failed to load dashboard data");
      }
    };

    fetchLinks();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const onFilesSelected = (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "error",
          title: "Invalid File Type",
          text: "Only JPG, PNG, JPEG, and PDF files are allowed.",
        });
        setBankData((prev) => ({ ...prev, bank_details_pdf: null }));
        return;
      }

      setBankData((prev) => ({ ...prev, bank_details_pdf: file }));
    } else {
      setBankData((prev) => ({ ...prev, bank_details_pdf: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    Object.entries(bankData).forEach(([key, value]) => {
      if (key === "bank_details_pdf" && value instanceof File) {
        formData.append(key, value);
      } else if (key !== "bank_details_pdf_url" && key !== "bank_details_pdf") {
        formData.append(key, value ?? '');
      }
    });

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
        throw new Error(errorData?.detail || JSON.stringify(errorData) || "Failed to submit bank details");
      }

      const responseData = await response.json();
      setBankData(prev => ({
        ...prev,
        id: responseData.id,
        bank_details_pdf_url: responseData.bank_details_pdf || null,
      }));
      setIsUpdating(true);
      setSuccess(isUpdating ? "Bank details updated successfully." : "Bank details added successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreviewFile = () => {
    if (bankData.bank_details_pdf_url) {
      const fileUrl = `http://localhost:8000${bankData.bank_details_pdf_url}`;
      window.open(fileUrl, "_blank");
    } else if (bankData.bank_details_pdf instanceof File) {
      const fileUrl = URL.createObjectURL(bankData.bank_details_pdf);
      window.open(fileUrl, "_blank");
    } else {
      Swal.fire({
        icon: "info",
        title: "No File Available",
        text: "No bank details PDF has been uploaded or selected.",
      });
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold">{dashboardData?.company}</h2>
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Header title="Bank Details" />
        <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg mt-6">
          <h2 className="text-2xl font-semibold text-center mb-6 text-blue-700">
            {isUpdating ? "Update Your Bank Details" : "Add Your Bank Details"}
          </h2>

          <div className="space-y-6">
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

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Attach PDF/Image (Optional)</label>
              <FileUpload
                isView={false}
                isCombine={false}
                initialFiles={bankData.bank_details_pdf_url ? [bankData.bank_details_pdf_url] : []}
                onFilesSelected={onFilesSelected}
                onDeletedFiles={() => {
                  setBankData((prev) => ({ ...prev, bank_details_pdf: null, bank_details_pdf_url: null }));
                }}
                onPreviewFile={handlePreviewFile}
                allowedFileTypes={allowedTypes}
              />
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md"
            >
              {isUpdating ? "Update Details" : "Submit Details"}
            </button>

            {success && <p className="text-green-600 text-center mt-4">{success}</p>}
            {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetails;