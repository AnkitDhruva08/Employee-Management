import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Pencil, Trash2 } from "lucide-react";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { fetchDashboardLink, fetchDashboard, fetchRoles } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import Swal from "sweetalert2";
import CompanyLogo from "../components/CompanyLogo";

const Role = () => {
  const [formData, setFormData] = useState({ role_name: "" });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const rolePerPage = 5;
  const HeaderTitle = "Roles";
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (/^[a-zA-Z0-9\s]*$/.test(value)) {
      setFormData({ ...formData, [name]: value });
      setError(null);
    } else {
      setError("Only alphabet characters (A-Z, a-z, 0-9) are allowed.");
    }
  };

  const fetchDashboardInfo = async () => {
    try {
      const links = await fetchDashboardLink(token);
      const dashboard = await fetchDashboard(token);
      const userRoles = await fetchRoles(token);
      setRoles(userRoles);
      setQuickLinks(links);
      setDashboardData(dashboard);
    } catch (err) {
      console.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
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

    if (!isSuperUser) {
      setError("You do not have permission to perform this action.");
      return;
    }

    if (!formData.role_name.trim()) {
      setError("Role name is required.");
      return;
    }

    try {
      const url = isEditMode
        ? `http://localhost:8000/api/roles/${editingRoleId}/`
        : `http://localhost:8000/api/roles/`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ role_name: "" });
        setShowModal(false);
        setIsEditMode(false);
        setEditingRoleId(null);
        fetchDashboardInfo();
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
  };

  const handleEditClick = (role) => {
    setFormData({ role_name: role.role_name });
    setEditingRoleId(role.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const deleteRole = async (id) => {
    if (!isSuperUser) {
      Swal.fire(
        "Permission Denied",
        "You are not authorized to delete roles.",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the role permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8000/api/roles/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          fetchDashboardInfo();
          Swal.fire("Deleted!", "The role has been deleted.", "success");
        } else {
          throw new Error("Failed to delete");
        }
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error!", "Failed to delete the role.", "error");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && (
          <CompanyLogo
            companyName={dashboardData.company}
            logoPath={dashboardData.company_logo}
          />
        )}
        <div className="flex justify-center mt-6">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title={HeaderTitle} />

        <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
          <h2 className="text-xl font-semibold">
            Manage <span className="font-bold">Roles</span>
          </h2>

          {isSuperUser && (
            <button
              onClick={() => {
                setShowModal(true);
                setIsEditMode(false);
                setFormData({ role_name: "" });
                setError(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium"
            >
              <FontAwesomeIcon icon={faUserPlus} /> Add New Role
            </button>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                ×
              </button>
              <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
                {isEditMode ? "Update Role" : "Insert Role"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Role Name
                  </label>
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
                  {isEditMode ? "Update" : "Submit"}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Loading Roles...
            </div>
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
                    <td className="p-3 border">
                      {(currentPage - 1) * rolePerPage + index + 1}
                    </td>
                    <td className="p-3 border">{role.role_name}</td>
                    <td className="p-3 border">
                      {isSuperUser ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditClick(role)}
                            className="text-yellow-500 hover:text-yellow-600"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => deleteRole(role.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Restricted</span>
                      )}
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
