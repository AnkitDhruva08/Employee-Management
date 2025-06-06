import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import SectionCard from "../components/SectionCard";
import Swal from 'sweetalert2';

const EmplyeeViews = () => {
  const { id } = useParams();
  const [quickLinks, setQuickLinks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [officeFormData, setOfficeFormData] = useState({
    date_of_joining: "",
    probation_end: "",
    reporting_to: "",
  });

  const token = localStorage.getItem("token");
  const HeaderTitle = "Employee Views";
  const BASE_URL = "http://localhost:8000";

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/Employee-Details-views/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch employee details");

      const data = await response.json();
      setEmployeeData(data);

      if (data?.office_details) {
        setOfficeFormData({
          date_of_joining: data.office_details.date_of_joining || "",
          probation_end: data.office_details.probation_end || "",
          reporting_to: data.office_details.reporting_to || "",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLinksAndData = async () => {
      try {
        const links = await fetchDashboardLink(token);
        const dashboard = await fetchDashboard(token);
        setQuickLinks(links);
        setDashboardData(dashboard);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Failed to load dashboard");
      }
    };

    fetchLinksAndData();
    fetchEmployeeData();
  }, [token]);

  const handleOfficeUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${BASE_URL}/api/employee-office-details/${id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(officeFormData),
        }
      );
  
      if (!response.ok) throw new Error("Failed to update office details");
  
      await fetchEmployeeData();
      setShowOfficeModal(false);
  
      // SweetAlert2 success popup
      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Office details updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.message,
      });
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold">{dashboardData?.company}</h2>
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Header title={HeaderTitle} />
        <div className="max-w-7xl mx-auto bg-white p-4 sm:p-6 md:p-8 mt-4 rounded-lg shadow-md">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="space-y-6">
              {/* Employee Details */}
              <SectionCard
                title="Employee Details"
                fields={[
                  {
                    label: "First Name",
                    value: employeeData.employee?.first_name,
                  },
                  {
                    label: "Middle Name",
                    value: employeeData.employee?.middle_name,
                  },
                  {
                    label: "Last Name",
                    value: employeeData.employee?.last_name,
                  },
                  {
                    label: "Contact Number",
                    value: employeeData.employee?.contact_number,
                  },
                  {
                    label: "Company Email",
                    value: employeeData.employee?.company_email,
                  },
                  {
                    label: "Personal Email",
                    value: employeeData.employee?.personal_email,
                  },
                  {
                    label: "Date of Birth",
                    value: employeeData.employee?.date_of_birth,
                  },
                  { label: "Gender", value: employeeData.employee?.gender },
                ]}
              />

              {/* Bank Details */}
              <SectionCard
                title="Bank Details"
                fields={[
                  {
                    label: "Account Holder Name",
                    value: employeeData.bank_details?.account_holder_name,
                  },
                  {
                    label: "Bank Name",
                    value: employeeData.bank_details?.bank_name,
                  },
                  {
                    label: "Branch Name",
                    value: employeeData.bank_details?.branch_name,
                  },
                  {
                    label: "Account Number",
                    value: employeeData.bank_details?.account_number,
                  },
                  {
                    label: "IFSC Code",
                    value: employeeData.bank_details?.ifsc_code,
                  },
                  {
                    label: "Account Type",
                    value: employeeData.bank_details?.account_type,
                  },
                  {
                    label: "Bank Documents",
                    value: (
                      <img
                        src={`${BASE_URL}${employeeData.document_details?.bank_details_pdf}`}
                        alt="Bank Doc"
                        className="w-24 h-24 rounded object-cover"
                      />
                    ),
                  },
                ]}
              />

              {/* Office Details with Edit Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">
                  Office Details
                </h3>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setShowOfficeModal(true)}
                >
                  Edit
                </button>
              </div>
              <SectionCard
                title=""
                fields={[
                  {
                    label: "Date of Joining",
                    value: employeeData.office_details?.date_of_joining,
                  },
                  {
                    label: "Probation End",
                    value: employeeData.office_details?.probation_end,
                  },
                  {
                    label: "Reporting To",
                    value: employeeData.office_details?.reporting_to,
                  },
                ]}
              />

              {/* Other Sections */}
              <SectionCard
                title="Nominee Details"
                fields={[
                  {
                    label: "Nominee Name",
                    value: employeeData.nominee_details?.nominee_name,
                  },
                  {
                    label: "DOB",
                    value: employeeData.nominee_details?.nominee_dob,
                  },
                  {
                    label: "Relation",
                    value: employeeData.nominee_details?.nominee_relation,
                  },
                  {
                    label: "Contact",
                    value: employeeData.nominee_details?.nominee_contact,
                  },
                ]}
              />

              <SectionCard
                title="Emergency Contact"
                fields={[
                  {
                    label: "Name",
                    value: employeeData.emergency_details?.emergency_name,
                  },
                  {
                    label: "Relation",
                    value: employeeData.emergency_details?.emergency_relation,
                  },
                  {
                    label: "Contact",
                    value: employeeData.emergency_details?.emergency_contact,
                  },
                ]}
              />

              <SectionCard
                title="Document Details"
                fields={[
                  {
                    label: "Insurance Number",
                    value: employeeData.document_details?.insurance_number,
                  },
                  {
                    label: "EPF Member",
                    value: employeeData.document_details?.epf_member,
                  },
                  { label: "UAN", value: employeeData.document_details?.uan },
                  ...[
                    "photo",
                    "appointment",
                    "aadhar",
                    "dl",
                    "esic_card",
                    "pan",
                    "resume",
                    "promotion",
                  ].map((doc) => ({
                    label: doc.replace(/_/g, " ").toUpperCase(),
                    value: (
                      <img
                        src={`${BASE_URL}${employeeData.document_details?.[doc]}`}
                        alt={doc}
                        className="w-24 h-24 rounded object-cover"
                      />
                    ),
                  })),
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Office Modal */}
      {showOfficeModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div className="bg-white p-8 rounded-xl max-w-lg w-full shadow-2xl transform transition-transform animate-scaleIn">
            <h2
              id="modal-title"
              className="text-2xl font-bold mb-6 text-blue-700"
            >
              Edit Office Details
            </h2>
            <form onSubmit={handleOfficeUpdate} className="space-y-5">
              {["date_of_joining", "probation_end", "reporting_to"].map(
                (field) => (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      className="block text-sm font-medium mb-2 capitalize text-gray-700"
                    >
                      {field.replace(/_/g, " ")}
                    </label>
                    <input
                      id={field}
                      type={field === "reporting_to" ? "text" : "date"}
                      value={officeFormData[field]}
                      onChange={(e) =>
                        setOfficeFormData({
                          ...officeFormData,
                          [field]: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder={`Enter ${field.replace(/_/g, " ")}`}
                      required
                    />
                  </div>
                )
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowOfficeModal(false)}
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmplyeeViews;
