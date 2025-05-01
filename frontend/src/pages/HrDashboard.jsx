import { useState, useEffect } from "react";
import { FaUser, FaTicketAlt, FaWallet, FaCalendarAlt, FaUsers, FaClipboardList } from "react-icons/fa"; 
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import { useNavigate, Link, useParams } from "react-router-dom";
import { fetchDashboard, fetchDashboardLink } from "../utils/api";
import * as FaIcons from "react-icons/fa";
import { Pencil, Trash2, Eye } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";


const HrDashboard = () => {
  const [quickLinks, setQuickLinks] = useState([]);
  const HeaderTitle = 'Hr Dashboard';
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const HrDashboardUrl = `http://localhost:8000/api/hr-dashboard-link/`;


  const fetchLinks = async () => {
 
    try {
      const links = await fetchDashboardLink(token, HrDashboardUrl);
      const dashboardData = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboardData);
    } catch (err) {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchLinks();
  }, []); 



  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }


  const downloadEmployeePDF = async () => {
    const res = await fetch('http://localhost:8000/api/download-employee-report/', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  
    const blob = await res.blob();
    console.log("blob:", blob);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_report.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  
  return (
    <div className="flex h-screen bg-gray-100">
    {/* Sidebar */}
    <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
      <h2 className="text-xl font-semibold text-white">
        {dashboardData.company}
      </h2>
      <div className="flex justify-center mb-8">
        {/* Render Sidebar */}
        <Sidebar quickLinks={quickLinks} />
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col">
      {/* ✅ Header */}
      <Header title={HeaderTitle} />

      <div className="p-6 overflow-y-auto flex-1">
        {/* Stats Cards */}
        <div className="p-6 overflow-y-auto flex-1">
  {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      {
        label: "Total Employees",
        value: dashboardData.total_employees,
        icon: <FaIcons.FaUsers className="text-3xl text-blue-500" />,
        url: "/employees",
      },
      {
        label: "Total Leave Requests",
        value: dashboardData.total_leave_requests,
        icon: <FaIcons.FaClipboardList className="text-3xl text-green-500" />,
        url: "/leave-table",
      },
      {
        label: "Upcoming Events",
        value: dashboardData.upcoming_events,
        icon: <FaIcons.FaCalendarAlt className="text-3xl text-purple-500" />,
        url: "/events",
      },
    ].map(({ label, value, icon, url }, index) => (
      <Link
        to={url || "#"}
        key={index}
        className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-all hover:bg-gray-50"
      >
        <div>
          <h4 className="text-lg font-semibold text-gray-600">{label}</h4>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div>{icon}</div>
      </Link>
    ))}
  </div>
</div>

          <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
                  <h2 className="text-xl font-semibold">
                    Manage <span className="font-bold">Employees</span>
                  </h2>
                 
                <button
                onClick={downloadEmployeePDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-medium"
              >
                Download Employee Report
              </button>
                </div>

        <div className="overflow-x-auto p-4">
  {loading ? (
    <div className="p-6 text-center text-gray-500">Loading employees...</div>
  ) : (
    <table className="min-w-full text-sm border-t shadow-md rounded overflow-hidden">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="p-3 border text-left">Sr no.</th>
          <th className="p-3 border text-left">Employees Name</th>
          <th className="p-3 border text-left">Company Name</th>
          <th className="p-3 border text-left">Comapany Email</th>
          <th className="p-3 border text-left">Personal Email</th>
          <th className="p-3 border text-left">Contact Number</th>
          <th className="p-3 border text-left">Role</th>
          <th className="p-3 border text-left">Date Of Birth</th>
          <th className="p-3 border text-left">Gender</th>
          <th className="p-3 border text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.employee_details.map((emp, index) => (
          <tr key={index} className="border hover:bg-gray-50">
            <td className="p-3 border">{index + 1}</td>
            <td className="p-3 border">{`${emp.first_name} ${emp.middle_name} ${emp.last_name}`}</td>
            <td className="p-3 border">{dashboardData.company}</td>
            <td className="p-3 border">{emp.company_email}</td>
            <td className="p-3 border">{emp.personal_email}</td>
            <td className="p-3 border">{emp.contact_number}</td>
            <td className="p-3 border">{emp.role__role_name}</td>
            <td className="p-3 border">{emp.date_of_birth}</td>
            <td className="p-3 border">{emp.gender}</td>
            <td className="p-3 border">
              <div className="flex space-x-3">
                <button className="text-blue-600 hover:text-blue-800">
                  <FaIcons.FaEye />
                </button>
                <Link to={`/add-employees/${emp.id}`} className="text-yellow-500 hover:text-yellow-600">
                  <FaIcons.FaEdit />
                </Link>
                {/* <button
                  onClick={() => deleteEmployee(emp.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaIcons.FaTrash />
                </button> */}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      </div>
    </div>
  </div>
  );
};

export default HrDashboard;
