import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import CkEditor from "../components/editor/CkEditor"; 
import { Eye, Pencil, Trash2 } from "lucide-react";
import Select from "react-select";
import ProjectCreationModal from '../components/modal/ProjectCreationModal'; 
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
  const [currentProjectData, setCurrentProjectData] = useState(null); 
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
    "On Hold": "#F59E0B" 
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


        setQuickLinks(links.data || links);
        setDashboardData(empDashboard);
        setProjects(projectsData.results);
        setTotalCount(projectsData.count);

        const employeesData = await fetchEmployees(token);
        setEmployees(Array.isArray(employeesData) ? employeesData : [employeesData]);
      } catch (err) {
        console.error("Error fetching data:", err);
        Swal.fire("Error", "Failed to fetch data. Please log in again.", "error");
        localStorage.clear();
        navigate('/login');
      }
    };
    fetchData();
  }, [token, navigate, currentPage, statusFilter, selectedProjectId]);


  // function for handle create and update project
  const handleAddOrUpdateProject = async (formData) => {
    const data = new FormData();
    for (const key in formData) {
      if (formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (Array.isArray(formData[key])) {
        formData[key].forEach(item => data.append(`${key}`, item));
      }
      else {
        data.append(key, formData[key]);
      }
    }

    console.log('formData ==<<<>', formData);

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

      const savedProject = await response.json();
      if (isEditMode) {
        setProjects((prev) =>
          prev.map((proj) =>
            proj.id === currentProjectData.id ? savedProject : proj
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
      setCurrentProjectData(null);
      const projectsData = await fetchProjects(token, currentPage, pageSize, statusFilter?.value || "", selectedProjectId);
      setProjects(projectsData.results);
      setTotalCount(projectsData.count);

    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };


  // open modal
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentProjectData(null); 
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setIsEditMode(true);
    console.log('project ==<<<>', project)
    setCurrentProjectData(project); 
    setModalOpen(true);
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
          setProjects((prev) => prev.filter((proj) => proj.id !== projectId));
          Swal.fire(
            "Deleted!",
            "Project has been deleted successfully.",
            "success"
          );
           // Re-fetch projects to ensure fresh data and pagination counts are correct
          const projectsData = await fetchProjects(token, currentPage, pageSize, statusFilter?.value || "", selectedProjectId);
          setProjects(projectsData.results);
          setTotalCount(projectsData.count);
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
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
            {["Total", "In Progress", "Done", "Blocked", "Planned", "On Hold"].map((label, idx) => (
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
            {roleId === 1 && ( // Assuming only admin can add projects
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 whitespace-nowrap"
                onClick={openAddModal}
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
                onChange={(opt) => setSelectedProjectId(opt?.value || null)} // Handle clear
                isClearable
                placeholder="Filter by Project"
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
              />
            </div>
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
                        {(roleId === 1 || roleId === 2) && ( 
                          <button
                            className="text-green-500 hover:text-green-700 transition"
                            onClick={() => openEditModal(project)}
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        {roleId === 1 && ( 
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

          {/* Project Creation/Edit Modal */}
          <ProjectCreationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleAddOrUpdateProject} 
            initialData={currentProjectData} 
            employees={employees} 
            isEditMode={isEditMode}
          />

{viewModalOpen && viewProject && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Project Details</h2>

      <div className="space-y-4 text-gray-800">
        <p>
          <strong>Project Name:</strong> {viewProject.project_name}
        </p>
        <div>
          <strong>Description:</strong>
          <div
            className="prose prose-sm max-w-none p-2 border rounded bg-gray-50 overflow-auto max-h-40 mt-1"
            dangerouslySetInnerHTML={{ __html: viewProject.description }}
          />
        </div>
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
              backgroundColor: statusColors[viewProject.status] || "#9CA3AF",
            }}
          >
            {viewProject.status}
          </span>
        </p>
        {viewProject.phase && (
          <p>
            <strong>Phase:</strong> {viewProject.phase}
          </p>
        )}
        {viewProject.company_name && (
          <p>
            <strong>Company Name:</strong> {viewProject.company_name}
          </p>
        )}
        {viewProject.client_name && (
          <p>
            <strong>Client Name:</strong> {viewProject.client_name}
          </p>
        )}
        {viewProject.assigned_to && viewProject.assigned_to.length > 0 && employees.length > 0 && (
          <p>
            <strong>Assigned To:</strong>{" "}
            {viewProject.assigned_to
              .map(id => employees.find(emp => emp.id === id)?.name || `Employee ${id}`)
              .join(", ")}
          </p>
        )}
        <p>
          <strong>Design Available:</strong>{" "}
          {viewProject.design_available ? "Yes" : "No"}
        </p>
        {viewProject.srs_file && (
          <p>
            <strong>SRS Document:</strong>{" "}
            <a
              href={viewProject.srs_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View SRS
            </a>
          </p>
        )}
        {viewProject.wireframe_file && (
          <p>
            <strong>Wireframe Document:</strong>{" "}
            <a
              href={viewProject.wireframe_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Wireframe
            </a>
          </p>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => setViewModalOpen(false)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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