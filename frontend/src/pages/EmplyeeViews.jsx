import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import SectionCard from '../components/SectionCard'
import DocumentViewer from '../components/File/DocumentViewer';
// const LabeledInput = ({ label, value }) => (
//   <div className="w-1/3 px-2 mb-4">
//     <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//     <input
//       type="text"
//       value={value || ""}
//       disabled
//       className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
//     />
//   </div>
// );

// const SectionCard = ({ title, fields }) => (
//   <div className="bg-white shadow-md rounded-md p-6 mb-6">
//     <h3 className="text-xl font-semibold mb-4 text-blue-600">{title}</h3>
//     <div className="flex flex-wrap -mx-2">
//       {fields.map(({ label, value }, index) => (
//         <LabeledInput key={index} label={label} value={value} />
//       ))}
//     </div>
//   </div>
// );

const EmplyeeViews = () => {
  const { id } = useParams();
  const [quickLinks, setQuickLinks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const HeaderTitle = "Employee Views";
  const BASE_URL = "http://localhost:8000";

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/Employee-Details-views/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employee details");
      }

      const data = await response.json();
      setEmployeeData(data);
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
          {/* Section Cards */}
          <SectionCard
            title="Employee Details"
            fields={[
              { label: "First Name", value: employeeData.employee?.first_name },
              { label: "Middle Name", value: employeeData.employee?.middle_name },
              { label: "Last Name", value: employeeData.employee?.last_name },
              { label: "Contact Number", value: employeeData.employee?.contact_number },
              { label: "Company Email", value: employeeData.employee?.company_email },
              { label: "Personal Email", value: employeeData.employee?.personal_email },
              { label: "Date of Birth", value: employeeData.employee?.date_of_birth },
              { label: "Gender", value: employeeData.employee?.gender },
            ]}
          />

          <SectionCard
            title="Bank Details"
            fields={[
              { label: "Account Holder Name", value: employeeData.bank_details?.account_holder_name },
              { label: "Bank Name", value: employeeData.bank_details?.bank_name },
              { label: "Branch Name", value: employeeData.bank_details?.branch_name },
              { label: "Account Number", value: employeeData.bank_details?.account_number },
              { label: "IFSC Code", value: employeeData.bank_details?.ifsc_code },
              { label: "Account Type", value: employeeData.bank_details?.account_type },
              { label: "Bank Documents", 
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.
                        bank_details_pdf
                        }`}
                      alt="ESIC"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              
             },
            ]}
          />

          <SectionCard
            title="Office Details"
            fields={[
              { label: "Date of Joining", value: employeeData.office_details?.date_of_joining },
              { label: "Probation End", value: employeeData.office_details?.probation_end },
              { label: "Job Role", value: employeeData.office_details?.job_role },
              { label: "Reporting To", value: employeeData.office_details?.reporting_to },
            ]}
          />

          <SectionCard
            title="Nominee Details"
            fields={[
              { label: "Nominee Name", value: employeeData.nominee_details?.nominee_name },
              { label: "DOB", value: employeeData.nominee_details?.nominee_dob },
              { label: "Relation", value: employeeData.nominee_details?.nominee_relation },
              { label: "Contact", value: employeeData.nominee_details?.nominee_contact },
            ]}
          />

          <SectionCard
            title="Emergency Contact"
            fields={[
              { label: "Name", value: employeeData.emergency_details?.emergency_name },
              { label: "Relation", value: employeeData.emergency_details?.emergency_relation },
              { label: "Contact", value: employeeData.emergency_details?.emergency_contact },
            ]}
          />

          <SectionCard
            title="Document Details"
            fields={[
              { label: "Insurance Number", value: employeeData.document_details?.insurance_number },
              { label: "EPF Member", value: employeeData.document_details?.epf_member },
              { label: "UAN", value: employeeData.document_details?.uan },
              {
                label: "Photo",
                value: (
                  <img
                    src={`${BASE_URL}${employeeData.document_details?.photo}`}
                    alt="Photo"
                    className="w-24 h-24 rounded object-cover"
                  />
                ),
              },
              {
                label: "Appointment",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.appointment}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Adhar Card",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.aadhar}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Driving Liecense",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.dl}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Esic Card",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.esic_card}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Pan",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.pan}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Resume",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.resume}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              },
              {
                label: "Promotion",
                value: (
                    <img
                      src={`${BASE_URL}${employeeData.document_details?.promotion}`}
                      alt="Photo"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ),
              }
            
            ]}
          />
        </div>
      )}
    </div>
  </div>
    </div>
  );
};

export default EmplyeeViews;
