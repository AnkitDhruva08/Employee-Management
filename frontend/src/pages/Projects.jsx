import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import CkEditor from "../components/editor/CkEditor";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Select from "react-select";

import {
  fetchDashboard,
  fetchProjects,
  fetchProjectSidebar,
  fetchEmployees,
} from "../utils/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Swal from "sweetalert2";

const Projects = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newProject, setNewProject] = useState({
    project_name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'In Progress',
    phase: '',
    companyName: '',
    clientName: '',
    assignedTo: [],
    designAvailable: false,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;
  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Done", label: "Done" },
    { value: "Blocked", label: "Blocked" },
  ];

  const HeaderTitle = isSuperUser
    ? "Superuser Dashboard"
    : isCompany
    ? "Company Projects"
    : roleId === 3
    ? "Employee Projects"
    : roleId === 2
    ? "HR Projects"
    : roleId === 1
    ? "Admin Projects"
    : "Projects";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const links = await fetchProjectSidebar(token);
        const empDashboard = await fetchDashboard(token);
        const projectsData = await fetchProjects(
          token,
          currentPage,
          pageSize,
          statusFilter?.value || "",
          selectedProjectId
        );
        console.log(projectsData);

        setQuickLinks(links.data || links);
        setDashboardData(empDashboard);
        setProjects(projectsData.results);
        setTotalCount(projectsData.count);
        const employeesData = await fetchEmployees(token);
        setEmployees(Array.isArray(employeesData) ? employeesData : [employeesData]);
      } catch (err) {
        navigate("/login");
      }
    };
    fetchData();
  }, [token, navigate, currentPage, statusFilter, selectedProjectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewProject((prev) => ({
      ...prev,
      srsDocument: file, // Store the actual file object
    }));
  };

  const handleAddOrUpdateProject = async (e) => {
    e.preventDefault();
    const url = isEditMode
      ? `http://localhost:8000/api/update-project/${currentProjectId}/`
      : `http://localhost:8000/api/create-project/`;

    try {
      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save project");
      }

      const savedProject = await response.json();
      if (isEditMode) {
        setProjects((prev) =>
          prev.map((proj) =>
            proj.id === currentProjectId ? savedProject : proj
          )
        );
      } else {
        setProjects((prev) => [...prev, savedProject]);
      }

      Swal.fire(
        "Success!",
        `Project ${isEditMode ? "updated" : "created"} successfully.`,
        "success"
      );
      setModalOpen(false);
      setIsEditMode(false);
      setNewProject({
        project_name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "In Progress",
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const openEditModal = (project) => {
    setNewProject({
      project_name: project.project_name,
      description: project.description,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status,
    });
    setCurrentProjectId(project.id);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const statusColors = {
    "In Progress": "#F97316",
    Done: "#22C55E",
    Blocked: "#EF4444",
  };

  const statusDistribution = Object.keys(statusColors).map((status) => ({
    name: status,
    value: projects.filter((p) => p.status === status).length,
  }));

  const timelineData = projects
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .map((proj, index) => ({
      date: proj.start_date,
      total: index + 1,
    }));

  const handleDelete = async (projectId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/delete-project/${projectId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete project");
      }
      setProjects((prev) => prev.filter((proj) => proj.id !== projectId));
      Swal.fire(
        "Deleted!",
        "Project has been deleted successfully.",
        "success"
      );
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Filtered projects based on selected filters
  const filteredProjects = projects.filter((project) => {
    const matchesProject =
      !selectedProjectId || project.id === selectedProjectId;
    const matchesStatus =
      !statusFilter || project.status === statusFilter.value;
    return matchesProject && matchesStatus;
  });
  

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company}</h2>
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex flex-col flex-1">
        <Header title={HeaderTitle} />

        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700">
            Projects Overview
          </h2>

          {/* Dashboard cards */}
          <div className="grid grid-cols-1 whitespace-nowrap   md:grid-cols-4 gap-4 mb-6">
            {["Total", "In Progress", "Done", "Blocked"].map((label, idx) => (
              <div key={idx} className="bg-white p-5 shadow rounded">
                <p className="text-sm text-gray-500">{label} Projects</p>
                <h3 className="text-2xl font-bold text-indigo-700">
                  {label === "Total"
                    ? projects.length
                    : projects.filter((p) => p.status === label).length}
                </h3>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">Project Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={index} fill={statusColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366F1"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
            {/* Add Project Button */}
            {roleId === 1 && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-indigo-700 whitespace-nowrap"
                onClick={() => {
                  setIsEditMode(false);
                  setNewProject({
                    project_name: "",
                    description: "",
                    startDate: "",
                    endDate: "",
                    status: "In Progress",
                  });
                  setModalOpen(true);
                }}
              >
                + Add Project
              </button>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 lg:gap-6 items-center flex-1 lg:justify-end">
              <Select
                className="w-full sm:w-48 lg:w-60"
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.project_name,
                }))}
                onChange={(opt) => setSelectedProjectId(opt?.value)}
                isClearable
                placeholder="Filter by Project"
              />
              <Select
                className="w-full sm:w-48 lg:w-60"
                options={statusOptions}
                onChange={setStatusFilter}
                isClearable
                placeholder="Filter by Status"
              />
            </div>
          </div>

          {/* Project Table */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-blue-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Start</th>
                  <th className="px-6 py-4 text-left">End</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  {roleId === 3 && (
                    <th className="px-6 py-4 text-left">Progress</th>
                  )}
                  {roleId === 3 && (
                    <th className="px-6 py-4 text-left">Team Leader</th>
                  )}
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((project, index) => (
                  <tr
                    key={index}
                    className="hover:bg-blue-50 transition-all duration-150"
                  >
                    <td className="px-6 py-4 font-medium">
                      {project.project_name}
                    </td>
                    <td className="px-6 py-4">{project.start_date}</td>
                    <td className="px-6 py-4">{project.end_date}</td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-block px-2 py-1 whitespace-nowrap rounded-full text-white text-xs font-medium"
                        style={{
                          backgroundColor:
                            statusColors[project.status] || "#9CA3AF",
                        }}
                      >
                        {project.status}
                      </span>
                    </td>
                    {roleId === 3 && (
                      <td className="px-6 py-4">
                        {project.progress ? (
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="h-4 rounded-full text-[10px] font-semibold text-white text-center"
                              style={{
                                width: `${project.progress}%`,
                                backgroundColor:
                                  project.progress >= 80
                                    ? "#22C55E"
                                    : project.progress >= 50
                                    ? "#F97316"
                                    : "#EF4444",
                              }}
                            >
                              {project.progress}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    )}
                    {roleId === 3 && (
                      <td className="px-6 py-4 text-gray-800">
                        {project.team_leader || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                      <button
                        className="text-blue-500 hover:text-blue-700 transition"
                        onClick={() => {
                          setViewProject(project);
                          setViewModalOpen(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="text-green-500 hover:text-green-700 transition"
                        onClick={() => openEditModal(project)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 transition"
                        onClick={() => handleDelete(project.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4 px-6 py-2 bg-gray-100 rounded-b">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(totalCount / pageSize)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (currentPage < Math.ceil(totalCount / pageSize)) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === Math.ceil(totalCount / pageSize)}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white rounded-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto p-6 shadow-lg">
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-3 right-4 text-gray-600 text-2xl hover:text-black"
                >
                  &times;
                </button>

                <h3 className="text-2xl font-bold mb-6 text-center">
                  {isEditMode ? "Update Project" : "Add New Project"}
                </h3>

                {/* Project Name */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">Project Name *</label>
                  <input
                    type="text"
                    name="project_name"
                    value={newProject.project_name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">Project Description</label>
                  <CkEditor
                    value={newProject.description}
                    onChange={(val) =>
                      setNewProject((prev) => ({ ...prev, description: val }))
                    }
                  />
                </div>

                {/* SRS Upload */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">Upload SRS Document</label>
                  <input
                    type="file"
                    name="srs"
                    onChange={handleFileChange}
                    className="w-full border rounded px-3 py-2"
                    accept=".pdf,.doc,.docx"
                  />
                </div>

                {/* Design Availability */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    name="designAvailable"
                    checked={newProject.designAvailable}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        designAvailable: e.target.checked,
                      }))
                    }
                  />
                  <label>Design available in Figma</label>
                </div>

                {/* Start & End Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={newProject.startDate}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={newProject.endDate}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                {/* Phase */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">Project Phase</label>
                  <input
                    type="text"
                    name="phase"
                    value={newProject.phase}
                    onChange={handleInputChange}
                    placeholder="e.g., Development"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Optional Company & Client */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium mb-1">Company Name (Optional)</label>
                    <input
                      type="text"
                      name="companyName"
                      value={newProject.companyName}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Client Name (Optional)</label>
                    <input
                      type="text"
                      name="clientName"
                      value={newProject.clientName}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                {/* Assign Team */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">Assign to Teams</label>
                  <Select
                    isMulti
                    options={employees.map((emp) => ({
                      value: emp.id,
                      label: `${emp.username}`,
                    }))}
                    value={newProject.assignedTo}
                    onChange={(selected) =>
                      setNewProject((prev) => ({ ...prev, assignedTo: selected || [] }))
                    }
                    placeholder="Select employees"
                  />
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="block font-medium mb-1">Project Status</label>
                  <select
                    name="status"
                    value={newProject.status}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>In Progress</option>
                    <option>Done</option>
                    <option>Blocked</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOrUpdateProject} // manually call handler
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
                  >
                    {isEditMode ? "Update Project" : "Create Project"}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* modal form for view */}
          {viewModalOpen && viewProject && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white rounded p-6 w-full max-w-lg relative">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="absolute top-3 right-4 text-gray-600 text-xl"
                >
                  &times;
                </button>
                <h3 className="text-xl font-semibold mb-4">Project Details</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {viewProject.project_name}
                  </p>
                  <p>
                    <strong>Description:</strong>
                  </p>
                  <div
                    className="prose prose-sm max-w-none p-2 border rounded bg-gray-50"
                    dangerouslySetInnerHTML={{
                      __html: viewProject.description,
                    }}
                  />
                  <p>
                    <strong>Start Date:</strong> {viewProject.start_date}
                  </p>
                  <p>
                    <strong>End Date:</strong> {viewProject.end_date}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className="px-2 py-1 rounded text-white text-xs"
                      style={{
                        backgroundColor:
                          statusColors[viewProject.status] || "#9CA3AF",
                      }}
                    >
                      {viewProject.status}
                    </span>
                  </p>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="bg-red-500 text-white  px-4 py-2 rounded hover:bg-red-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Projects;
