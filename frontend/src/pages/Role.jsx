import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from "../components/header/Header";
import CompanySidebar from "../components/sidebar/CompanySidebar";
import { fetchCompanyDashboardLinks, fetchDashboard } from "../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Pencil, Trash2, Eye } from "lucide-react";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

const Role = () => {
  const [formData, setFormData] = useState({ role_name: '' });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // 👈 Modal state

  const rolePerPage = 5;
  const HeaderTitle = "Roles";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/roles-dropdown/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

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

  useEffect(() => {
    fetchRoles();
    fetchDashboardInfo();
  }, []);

  const currentRole = roles.slice(
    (currentPage - 1) * rolePerPage,
    currentPage * rolePerPage
  );

  const totalPages = Math.ceil(roles.length / rolePerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/roles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 201) {
        setFormData({ role_name: '' }); // Clear form
        fetchRoles(); // Refresh roles
        setShowModal(false); // Close modal
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-white">
          {dashboardData?.company || "Loading..."}
        </h2>
        <div className="flex justify-center mt-6">
          <CompanySidebar quickLinks={quickLinks} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title={HeaderTitle} />

        {/* Page Heading and Add Button */}
        <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
          <h2 className="text-xl font-semibold">
            Manage <span className="font-bold">Roles</span>
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium"
          >
            <FontAwesomeIcon icon={faUserPlus} /> Add New Role
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                ×
              </button>
              <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Insert Roles</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    name="role_name"
                    value={formData.role_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading Roles...</div>
          ) : (
            <table className="min-w-full text-sm border-t shadow-md rounded overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border text-left">Sr no.</th>
                  <th className="p-3 border text-left">Role Name</th>
                  <th className="p-3 border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRole.map((role, index) => (
                  <tr key={role.id} className="border hover:bg-gray-50">
                    <td className="p-3 border">{index + 1}</td>
                    <td className="p-3 border">{role.role_name}</td>
                    <td className="p-3 border">
                      <div className="flex space-x-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={18} />
                        </button>
                        <Link to={`/add-employees/${role.id}`} className="text-yellow-500 hover:text-yellow-600">
                          <Pencil size={18} />
                        </Link>
                        <button
                          onClick={() => deleteEmployee(role.id)}
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

      </main>
    </div>
  );
};

export default Role;
