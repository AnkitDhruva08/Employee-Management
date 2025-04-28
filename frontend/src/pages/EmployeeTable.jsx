import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import Header from "../components/header/Header";
import CompanySidebar from "../components/sidebar/CompanySidebar";
import { fetchCompanyDashboardLinks, fetchDashboard } from "../utils/api";

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

  useEffect(() => {
    fetchEmployees();
    fetchDashboardInfo();
  }, []);

  const fetchDashboardInfo = async () => {
    try {
      const links = await fetchCompanyDashboardLinks(token);
      const dashboard = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboard);
    } catch (err) {
      console.error("Failed to load dashboard data");
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

  const currentEmployees = employees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const totalPages = Math.ceil(employees.length / employeesPerPage);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
          {dashboardData?.company || "Loading..."}
        </h2>
        <div className="flex justify-center mt-6">
          <CompanySidebar quickLinks={quickLinks} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title={HeaderTitle} />

        {/* Page Heading and Add Button */}
        <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
          <h2 className="text-xl font-semibold">
            Manage <span className="font-bold">Employees</span>
          </h2>
          <Link
            to="/add-employees"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium"
          >
            <FontAwesomeIcon icon={faUserPlus} /> Add New Employee
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-[10px] bg-red-100 text-red-700 px-4 py-2 border-l-4 border-red-500">
            {error}
          </div>
        )}

        {/* Table */}
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
                {currentEmployees.map((emp, index) => (
                  <tr key={emp.id} className="border hover:bg-gray-50">
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
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={18} />
                        </button>
                        <Link to={`/add-employees/${emp.id}`} className="text-yellow-500 hover:text-yellow-600">
                          <Pencil size={18} />
                        </Link>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
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
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 bg-white border-t text-sm rounded-b gap-2">
            <span className="text-gray-700">
              Showing {currentEmployees.length} out of {employees.length} entries
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
