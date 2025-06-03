import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import FileUpload from "../components/File/FileUpload"; 
import Sidebar from "../components/sidebar/Sidebar";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Select from "react-select";
import ProjectCreationModal from '../components/modal/ProjectCreationModal';
import {
  fetchDashboard,
  fetchProjects,
  fetchProjectSidebar,
  fetchEmployees,
  fetchProjectById,
  fetchProjectDropdown,
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
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [projectDropdownOptions, setProjectDropdownOptions] = useState([]);

  // Filters and pagination state for the "all projects" view
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State to hold the counts for different project statuses
  const [projectStatusCounts, setProjectStatusCounts] = useState({
    "In Progress": 0,
    Done: 0,
    Blocked: 0,
    Planned: 0,
    "On Hold": 0,
    Total: 0,
  });

  const pageSize = 5;

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Consolidated status options for table display and filter
  const statusColors = {
    "In Progress": "#F97316",
    Done: "#22C55E",
    Blocked: "#EF4444",
    Planned: "#3B82F6",
    "On Hold": "#F59E0B",
  };

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

  // Using useCallback to memoize fetchData and prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      const links = await fetchProjectSidebar(token);
      const empDashboard = await fetchDashboard(token);
      const employeesData = await fetchEmployees(token);
      const projectDropdownResponse = await fetchProjectDropdown(token);

      setQuickLinks(links.data || links);
      setDashboardData(empDashboard);
      setEmployees(Array.isArray(employeesData) ? employeesData : [employeesData]);

      // Assuming projectDropdownResponse contains a 'projects' array
      setProjectDropdownOptions(
        projectDropdownResponse.projects.map((p) => ({
          value: p.id,
          label: p.project_name,
        }))
      );

      if (id) {
        // If ID is present in the URL, fetch only that specific project
        const projectData = await fetchProjectById(token, id);
        console.log('projectData ==>>', projectData) 
        setProjects([projectData]);
        setTotalCount(1);
        setSelectedProjectId(projectData.id);
        setCurrentProjectData(projectData);

        // For a single project view, update counts based on that project
        setProjectStatusCounts((prevCounts) => ({
          ...prevCounts,
          "In Progress": projectData.status === "In Progress" ? 1 : 0,
          Done: projectData.status === "Done" ? 1 : 0,
          Blocked: projectData.status === "Blocked" ? 1 : 0,
          Planned: projectData.status === "Planned" ? 1 : 0,
          "On Hold": projectData.status === "On Hold" ? 1 : 0,
          Total: 1,
        }));
      } else {
        // Otherwise, fetch all projects with filters and pagination
        const projectsData = await fetchProjects(
          token,
          currentPage,
          pageSize,
          statusFilter?.value || "",
          selectedProjectId
        );

        setProjects(projectsData.results);
        setTotalCount(projectsData.count);

        // Update project status counts from the API response
        setProjectStatusCounts({
          "In Progress": projectsData["In Progress"] || 0,
          Done: projectsData.Done || 0,
          Blocked: projectsData.Blocked || 0,
          Planned: projectsData.Planned || 0,
          "On Hold": projectsData["On Hold"] || 0,
          Total: projectsData.count || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire("Error", "Failed to fetch data. Please log in again.", "error");
      localStorage.clear();
      navigate('/login');
    }
  }, [token, navigate, currentPage, pageSize, statusFilter, selectedProjectId, id]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [fetchData, token]);

  // Function for handle create and update project
  const handleAddOrUpdateProject = async (formData) => {
    const data = new FormData();
    for (const key in formData) {
      if (formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (Array.isArray(formData[key])) {
        formData[key].forEach(item => data.append(`${key}`, item));
      } else {
        data.append(key, formData[key]);
      }
    }

    const url = isEditMode
      ? `http://localhost:8000/api/project-management/${currentProjectData.id}/`
      : `http://localhost:8000/api/project-management/`;

    try {
      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData));
      }

      Swal.fire(
        "Success!",
        `Project ${isEditMode ? "updated" : "created"} successfully.`,
        "success"
      );
      setModalOpen(false);
      setIsEditMode(false);
      setCurrentProjectData(null);

      // Re-fetch all data after successful add/update
      fetchData();

    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Open modal
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentProjectData(null);
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setIsEditMode(true);
    setCurrentProjectData(project);
    setModalOpen(true);
  };

  // Normalize projects to always be an array for chart and table rendering
  const normalizedProjects = Array.isArray(projects)
    ? projects
    : projects && typeof projects === "object"
      ? [projects]
      : [];

  const statusDistribution = Object.keys(statusColors).map((status) => ({
    name: status,
    value: normalizedProjects.filter((p) => p.status === status).length,
  }));

  const timelineData = normalizedProjects
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .map((proj, index) => ({
      date: proj.start_date,
      total: index + 1,
    }));

  const handleDelete = async (projectId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
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
          Swal.fire(
            "Deleted!",
            "Project has been deleted successfully.",
            "success"
          );
          // Re-fetch data after successful deletion
          if (id) {
            navigate('/projects'); 
          } else {
            fetchData(); 
          }
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  // Filtered projects based on selected filters (only applied if not viewing a single project by ID)
  const filteredProjects = id
    ? normalizedProjects
    : normalizedProjects.filter((project) => {
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

          {/* Dashboard cards - Only show if not viewing a single project */}
          {!id && (
            <div className="grid grid-cols-1 whitespace-nowrap md:grid-cols-4 gap-4 mb-6">
              {["Total", "In Progress", "Done", "Blocked", "Planned", "On Hold"].map((label, idx) => (
                <div key={idx} className="bg-white p-5 shadow rounded">
                  <p className="text-sm text-gray-500">{label} Projects</p>
                  <h3 className="text-2xl font-bold text-indigo-700">
                    {projectStatusCounts[label]}
                  </h3>
                </div>
              ))}
            </div>
          )}

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
            {(roleId === 1 || isCompany) && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 whitespace-nowrap"
                onClick={openAddModal}
              >
                + Add Project
              </button>
            )}

            {/* Filters - Only show if not viewing a single project */}
            {!id && (
              <div className="flex flex-wrap gap-4 lg:gap-6 items-center flex-1 lg:justify-end">
                <Select
                  className="w-full sm:w-48 lg:w-60"
                  options={projectDropdownOptions} 
                  onChange={(opt) => setSelectedProjectId(opt?.value || null)} 
                  isClearable
                  placeholder="Filter by Project"
                  value={selectedProjectId ? projectDropdownOptions.find(p => p.value === selectedProjectId) : null} 
                />
                <Select
                  className="w-full sm:w-48 lg:w-60"
                  options={[
                    { value: "In Progress", label: "In Progress" },
                    { value: "Done", label: "Done" },
                    { value: "Blocked", label: "Blocked" },
                    { value: "Planned", label: "Planned" },
                    { value: "On Hold", label: "On Hold" },
                  ]}
                  onChange={setStatusFilter}
                  isClearable
                  placeholder="Filter by Status"
                  value={statusFilter}
                />
              </div>
            )}
          </div>

          {/* Project Table */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-blue-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Project Name</th>
                  <th className="px-6 py-4 text-left">Started Date</th>
                  <th className="px-6 py-4 text-left">Project Phase</th>
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
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-blue-50 transition-all duration-150"
                    >
                      <td className="px-6 py-4 font-medium">
                        {project.project_name}
                      </td>
                      <td className="px-6 py-4">{project.start_date}</td>
                      <td className="px-6 py-4">{project.phase}</td>
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
                        {roleId === 1 || isCompany && (
                          <button
                            className="text-red-500 hover:text-red-700 transition"
                            onClick={() => handleDelete(project.id)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={roleId === 3 ? 7 : 5} className="px-6 py-4 text-center text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls - Only show if not viewing a single project */}
          {!id && (
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
          )}

          {/* Project Creation/Edit Modal */}
          <ProjectCreationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleAddOrUpdateProject}
            initialData={currentProjectData}
            employees={employees}
            isEditMode={isEditMode}
          />

          {/* View Project Details Modal */}
          {viewModalOpen && viewProject && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-3">Project Details</h2>
                <div className="space-y-5 text-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">Project Name:</p>
                      <p className="ml-2 text-gray-900">{viewProject.project_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Status:</p>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium ml-2"
                        style={{
                          backgroundColor: statusColors[viewProject.status] || "#9CA3AF",
                        }}
                      >
                        {viewProject.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Start Date:</p>
                      <p className="ml-2 text-gray-900">{viewProject.start_date}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">End Date:</p>
                      <p className="ml-2 text-gray-900">{viewProject.end_date}</p>
                    </div>
                    {viewProject.phase && (
                      <div>
                        <p className="font-semibold text-gray-700">Phase:</p>
                        <p className="ml-2 text-gray-900">{viewProject.phase}</p>
                      </div>
                    )}
                    {viewProject.company && (
                      <div>
                        <p className="font-semibold text-gray-700">Company Name:</p>
                        <p className="ml-2 text-gray-900">{viewProject.company}</p>
                      </div>
                    )}
                    {viewProject.client_name && (
                      <div>
                        <p className="font-semibold text-gray-700">Client Name:</p>
                        <p className="ml-2 text-gray-900">{viewProject.client_name}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-700">Design Available:</p>
                      <p className="ml-2 text-gray-900">{viewProject.design_available ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="font-semibold text-gray-700 mb-2">Description:</p>
                    <div
                      className="prose prose-sm max-w-none p-3 border rounded-lg bg-gray-50 overflow-auto max-h-48 text-gray-800"
                      dangerouslySetInnerHTML={{ __html: viewProject.description }}
                    />
                  </div>

                  {/* Enhanced Assigned To section */}
                  {viewProject.assigned_to && viewProject.assigned_to.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-gray-700 mb-3">Assigned Employees:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {viewProject.assigned_to.map((employee, index) => (
                          <div key={employee.id || index} className="bg-blue-50 p-4 rounded-lg shadow-sm">
                            <p className="font-medium text-blue-800">{employee.first_name} {employee.middle_name} {employee.last_name}</p>
                            {employee.role_name && <p className="text-sm text-gray-600">Role: {employee.role_name}</p>}
                            {employee.company_email && <p className="text-sm text-gray-600">Email: {employee.company_email}</p>}
                            {employee.contact_number && <p className="text-sm text-gray-600">Contact: {employee.contact_number}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Uploads for View Mode */}
                  <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewProject.srs_file && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2">SRS Document:</p>
                        <FileUpload
                          isView={true} 
                          initialFiles={[viewProject.srs_file]}
                          onFilesSelected={() => {}} 
                        />
                      </div>
                    )}
                    {viewProject.wireframe_file && viewProject.design_available && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2">Wireframe Document:</p>
                        <FileUpload
                          isView={true} 
                          initialFiles={[viewProject.wireframe_file]}
                          onFilesSelected={() => {}} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    Close
                  </button>
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