import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CompanyLogo from "../components/CompanyLogo";

// import logo from "../assets/Logo.png";
const EmployeeTable = () => {
  const token = localStorage.getItem("token");
  const HeaderTitle = "Employees Table";

  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const employeesPerPage = 5;
  const roleId = parseInt(localStorage.getItem("role_id"));

  const fetchDashboardInfo = async () => {
    try {
      const links = await fetchDashboardLink(token);
      const dashboard = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboard);
    } catch (err) {
      console.error("Failed to load dashboard data");
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/employees/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('data ==<<>>', data)
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8000/api/employees/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          fetchEmployees();
          Swal.fire("Deleted!", "The employee has been deleted.", "success");
        } else {
          throw new Error("Failed to delete");
        }
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error!", "Failed to delete the employee.", "error");
      }
    }
  };


  const toggleEmployeeStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    console.log('newStatus ==<<>>', newStatus);
  
    const action = newStatus === true ? "Activate"  : "Deactivate" ; 
    console.log('action ==<<>', action);
  
    const result = await Swal.fire({
      title: `Are you sure you want to ${action}?`,
      text: `This will ${action.toLowerCase()} the employee.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action.toLowerCase()}!`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
  
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8000/api/employees/${id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ active: newStatus }), 
        });
  
        if (res.ok) {
          fetchEmployees();
          Swal.fire("Success!", `Employee has been ${action.toLowerCase()}d.`, "success");
        } else {
          throw new Error("Failed to update status");
        }
      } catch (err) {
        console.error("Toggle error:", err);
        Swal.fire("Error!", "Failed to update employee status.", "error");
      }
    }
  };
  
  

  const currentEmployees = employees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const totalPages = Math.ceil(employees.length / employeesPerPage);

  const logoPath = dashboardData?.company_logo;
  const logoUrl = logoPath
    ? `http://localhost:8000/${
        logoPath.startsWith("media/") ? "" : "media/"
      }${logoPath}`
    : null;
  // Function to convert image URL to base64
  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  // Function to download the PDF
  async function downloadEmployeePDF(employees) {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add logo and header
    let logoBase64 = null;
    try {
      if (logoUrl) {
        console.log("yes url is tehre");
        logoBase64 = await getBase64ImageFromURL(logoUrl);
        doc.addImage(logoBase64, "PNG", 15, 10, 30, 15);
      }
    } catch (error) {
      console.warn("Logo not added. Error loading image:", error);
    }

    // Add company name in the header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(dashboardData?.company, pageWidth / 2, 20, { align: "center" });

    // Add report title
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Employee Report", pageWidth / 2, 30, { align: "center" });

    // Subtle underline for header
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 123, 255);
    doc.line(10, 35, pageWidth - 10, 35);

    // Table columns
    const tableColumn = [
      "Sr No.",
      "Name",
      "Company",
      "Company Email",
      "Personal Email",
      "Phone",
      "Role",
      "DOB",
      "Gender",
    ];

    // Table rows
    const tableRows = employees.map((emp, index) => [
      index + 1,
      emp.username || "",
      emp.company_name || "",
      emp.company_email || "",
      emp.personal_email || "",
      emp.contact_number || "",
      emp.role_name || "",
      emp.date_of_birth || "",
      emp.gender || "",
    ]);

    // Generate the table in the PDF using autoTable
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      styles: {
        fontSize: 10,
        cellPadding: 5,
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 12,
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 },
        4: { cellWidth: 50 },
        5: { cellWidth: 30, halign: "center" },
        6: { cellWidth: 30, halign: "center" },
        7: { cellWidth: 30, halign: "center" },
        8: { cellWidth: 20, halign: "center" },
      },
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "Generated on: " + new Date().toLocaleDateString(),
      15,
      pageHeight - 10
    );
    doc.text(
      "Page " + doc.internal.getNumberOfPages(),
      pageWidth - 30,
      pageHeight - 10
    );

    // Save the PDF
    doc.save("employee_report.pdf");
  }

  useEffect(() => {
    if (!token) return;
    fetchEmployees();
    fetchDashboardInfo();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && <CompanyLogo logoPath={dashboardData.company_logo} />}
        <div className="flex justify-center mt-6">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title={HeaderTitle} />

        {/* Page Heading and Add Button */}
        <div className="mx-4 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-t-xl mt-6 shadow-md">
          {/* <h2 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium">
            Manage <span className="font-bold">Employees</span>
          </h2> */}
          {roleId !== 2 && (
            <Link
              to="/add-employees"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium"
            >
              <FontAwesomeIcon icon={faUserPlus} /> Add New Employee
            </Link>
          )}

          <button
            onClick={() => downloadEmployeePDF(employees)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-medium"
          >
            Export PDF
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-[10px] bg-red-100 text-red-700 px-4 py-2 border-l-4 border-red-500">
            {error}
          </div>
        )}

        {/* Table */}
<div className="overflow-x-auto p-4 bg-white mx-4 rounded-b-xl shadow-lg">
  {loading ? (
    <div className="p-6 text-center text-gray-500">
      Loading employees...
    </div>
  ) : (
    <table className="min-w-full text-sm text-left">
      <thead className="bg-blue-700 text-white text-sm">
        <tr>
          <th className="p-3 border-b">Sr no.</th>
          <th className="p-3 border-b">Employees Name</th>
          <th className="p-3 border-b">Company Name</th>
          <th className="p-3 border-b">Company Email</th>
          <th className="p-3 border-b">Personal Email</th>
          <th className="p-3 border-b">Contact Number</th>
          <th className="p-3 border-b">Role</th>
          <th className="p-3 border-b">Date Of Birth</th>
          <th className="p-3 border-b">Gender</th>
          <th className="p-3 border-b">Actions</th>
        </tr>
      </thead>

      <tbody>
        {currentEmployees.map((emp, index) => (
          <tr
            key={emp.id}
            className="hover:bg-gray-50 even:bg-gray-50 border-b"
          >
            <td className="p-3 border">{index + 1}</td>
            <td className="p-3 border">{emp.username}</td>
            <td className="p-3 border">{emp.company_name}</td>
            <td className="p-3 border">{emp.company_email}</td>
            <td className="p-3 border">{emp.personal_email}</td>
            <td className="p-3 border">{emp.contact_number}</td>
            <td className="p-3 border">{emp.role_name}</td>
            <td className="p-3 border">{emp.date_of_birth}</td>
            <td className="p-3 border">{emp.gender}</td>
            <td className="p-3 border">
              <div className="flex space-x-3">
                {/* View is always allowed */}
                <Link
                  to={`/employee-views/${emp.id}`}
                  className="text-green-500 hover:text-yellow-600"
                >
                  <Eye size={18} />
                </Link>

                {/* Only show edit & toggle if not role_id 2 */}
                {roleId !== 2 && (
                  <>
                    <Link
                      to={`/employee-form/${emp.id}`}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <Pencil size={18} />
                    </Link> 
                    <button
                      onClick={() => toggleEmployeeStatus(emp.id, emp.active)}
                      className={`px-3 py-1 rounded-full text-white font-semibold text-xs transition-colors duration-200 shadow-md
                        ${emp.active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600' }
                      `}
                      title={emp.active ? "Activate Employee" : "Deactivate Employee"}
                    >
                      {emp.active ? 'Activate' : 'Deactivate'}
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>


        {/* Pagination */}
        {!loading && employees.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white mx-4 rounded-b-xl shadow-md text-sm gap-2">
            <span className="text-gray-700">
              Showing {currentEmployees.length} out of {employees.length}{" "}
              entries
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeTable;
