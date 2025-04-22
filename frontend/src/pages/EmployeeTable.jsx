import React, { useEffect, useState } from "react";
import AddEmployee from "./AddEmployee";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const roleMap = {
  1: "Admin",
  2: "HR",
  3: "Solution Engineer",
};

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("first_name");
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;
  const totalPages = Math.ceil(filtered.length / employeesPerPage);

  const token = localStorage.getItem("token");

  const fetchEmployees = async () => {
    const res = await fetch("http://localhost:8000/api/employees/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const list = data.results || [];
    setEmployees(list);
    setFiltered(list);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = employees.filter((emp) =>
      `${emp.first_name} ${emp.last_name} ${emp.company_email}`.toLowerCase().includes(term)
    );
    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, employees]);

  const sortBy = (key) => {
    const sorted = [...filtered].sort((a, b) => {
      const valA = (a[key] || "").toString().toLowerCase();
      const valB = (b[key] || "").toString().toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    setFiltered(sorted);
    setSortAsc(!sortAsc);
    setSortKey(key);
  };

  const deleteEmployee = async (id) => {
    await fetch(`http://localhost:8000/api/employees/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchEmployees();
  };

  const currentEmployees = filtered.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-blue-700">Employees</h2>

        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            + Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="w-full table-auto border-collapse border border-gray-200 bg-white rounded-xl text-sm">
          <thead className="bg-blue-50 text-gray-700 font-semibold">
            <tr>
              {["Name", "Contact", "Company Email", "Role"].map((col, i) => (
                <th
                  key={i}
                  onClick={() => sortBy(col.toLowerCase().replace(" ", "_"))}
                  className="px-4 py-3 text-left cursor-pointer hover:bg-blue-100 transition"
                >
                  {col} {sortKey === col.toLowerCase().replace(" ", "_") ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((emp) => (
              <tr key={emp.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {emp.first_name} {emp.middle_name} {emp.last_name}
                </td>
                <td className="px-4 py-3">{emp.contact_number}</td>
                <td className="px-4 py-3">{emp.company_email}</td>
                <td className="px-4 py-3">{roleMap[emp.role] || "Unknown"}</td>
                <td className="px-4 py-3 flex space-x-2">
                    <div className="flex space-x-2">
                        <Link to={`/employees/${emp.id}`} className="text-blue-600 hover:underline">
                        <Eye size={18} />
                        </Link>
                        <button className="text-green-600 hover:underline">
                        <Pencil size={18} />
                        </button>
                        <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="text-red-600 hover:underline"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-3xl">
           
            <AddEmployee />
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default EmployeeTable;

