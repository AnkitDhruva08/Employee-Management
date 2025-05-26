import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjects,
  fetchProjectSidebar,
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
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    project_name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "In Progress",
  });

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";
  console.log("roleId:", roleId);

  const HeaderTitle = isSuperUser
    ? "Superuser Dashboard"
    : isCompany
    ? "Company Projects Dashboard"
    : roleId === 3
    ? "Employee Projects Dashboard"
    : roleId === 2
    ? "HR Projects Dashboard"
    : roleId === 1
    ? "Admin Projects Dashboard"
    : "Dashboard";

  const fetchLinks = async () => {
    try {
      const links = await fetchProjectSidebar(token);
      setQuickLinks(links.data || links);
      const empDashboard = await fetchDashboard(token);
      const projectsData = await fetchProjects(token);
      console.log("Projects Data:", projectsData);

      setProjects(projectsData);

      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const statusDistribution = [
    {
      name: "In Progress",
      value: projects.filter((p) => p.status === "In Progress").length,
    },
    {
      name: "Done",
      value: projects.filter((p) => p.status === "Done").length,
    },
    {
      name: "Blocked",
      value: projects.filter((p) => p.status === "Blocked").length,
    },
  ];

  const COLORS = ["#F97316", "#22C55E", "#EF4444"];

  const timelineData = projects
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map((proj, index) => ({
      date: proj.startDate,
      total: index + 1,
    }));
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // function for add new project
  const handleAddProject = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:8000/api/create-project/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newProject),
        }
      );

      if (response.ok) {
        const createdProject = await response.json();

        await Swal.fire({
          title: "Success!",
          text: "Project has been added.",
          icon: "success",
          confirmButtonText: "OK",
        });

        setProjects([...projects, createdProject]);
        setModalOpen(false);
        setNewProject({
          project_name: "",
          description: "",
          startDate: "",
          endDate: "",
          status: "In Progress",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add project");
      }
    } catch (err) {
      console.error("Error adding project:", err);
      Swal.fire("Error", err.message || "Failed to add project", "error");
    }
  };

  if (error) {
    return (
      <div className="text-red-600 text-center mt-10 text-xl animate-pulse">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData.company}</h2>
        <Sidebar quickLinks={quickLinks} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header title={HeaderTitle} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-3xl font-bold text-blue-800 mb-6">Projects</h2>

          {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-1">Total Projects</h3>
                <p className="text-3xl font-extrabold">{projects.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-1">Active Projects</h3>
                <p className="text-3xl font-extrabold">
                  {projects.filter((p) => p.status === "In Progress" ? "In Progress" : p.project_status).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-1">
                  Completed Projects
                </h3>
                <p className="text-3xl font-extrabold">
                  {projects.filter((p) => p.status === "Done" ? p.status === "Done" : p.project_status ).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-1">Blocked Projects</h3>
                <p className="text-3xl font-extrabold">
                  {projects.filter((p) => p.status === "Blocked" ? p.status === "Blocked" : p.project_status).length}
                </p>
              </div>
            </div>
         

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Project Status Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Projects Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6366F1"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Add Project Button */}
          {(roleId === 1 || roleId === 2 || isCompany) && (
            <div className="flex justify-end mb-3">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
              onClick={() => setModalOpen(true)}
            >
              + Add Project
            </button>
          </div>
          )}
          

          {/* Projects Table */}
          <div className="overflow-x-auto shadow rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  {roleId === 3 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                  )}

                  {roleId === 3 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Leader
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.length > 0 ? (
                  projects.map((project, idx) => {
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-normal">
                          {project.project_name}
                        </td>
                        <td className="px-6 py-4 whitespace-normal">
                          {project.description
                            ? project.description
                            : project.project_description}
                        </td>
                        <td className="px-6 py-4">
                          {project.start_date
                            ? project.start_date
                            : project.project_start_date}
                        </td>
                        <td className="px-6 py-4">
                          {project.end_date
                            ? project.end_date
                            : project.project_end_date}
                        </td>

                        {roleId === 3 && (
                          <td className="px-6 py-4 w-48">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full ${
                                  project.progress === 100
                                    ? "bg-green-500"
                                    : project.progress >= 75
                                    ? "bg-green-400"
                                    : project.progress >= 50
                                    ? "bg-yellow-400"
                                    : project.progress >= 25
                                    ? "bg-orange-400"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </td>
                        )}

                        {roleId === 3 && (
                          <td className="px-6 py-4 w-48">
                            {project.team_leader}
                          </td>
                        )}

                        <td className="px-6 py-4">
                          <span
                            className={`px-1 py-1 rounded-full text-white text-xs font-semibold whitespace-nowrap  ${
                              project.status === "Done"
                                ? project.status === "Done"
                                : project.project_status === "Done"
                                ? "bg-green-500"
                                : project.status === "In Progress"
                                ? project.status === "In Progress"
                                : project.project_status === "In Progress"
                                ? "bg-orange-400"
                                : "bg-red-500"
                            }`}
                          >
                            {project.status
                              ? project.status
                              : project.project_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="space-y-2"></div>

            {/* Bug Tracking */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">
                Bug Tracking
              </h2>
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">ID</th>
                    <th className="py-2">Title</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: "#124",
                      title: "Login button not responsive",
                      status: "Open",
                      priority: "High",
                    },
                    {
                      id: "#130",
                      title: "Crash on submitting form",
                      status: "Blocked",
                      priority: "Critical",
                    },
                    {
                      id: "#135",
                      title: "UI misalignment on mobile",
                      status: "In Progress",
                      priority: "Medium",
                    },
                    {
                      id: "#140",
                      title: "Data sync failure",
                      status: "Open",
                      priority: "High",
                    },
                  ].map((bug, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 font-mono">{bug.id}</td>
                      <td className="py-2">{bug.title}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full whitespace-nowrap text-white text-xs font-semibold ${
                            bug.status === "Open"
                              ? "bg-red-600"
                              : bug.status === "Blocked"
                              ? "bg-red-400"
                              : "bg-orange-400"
                          }`}
                        >
                          {bug.status}
                        </span>
                      </td>
                      <td className="py-2">{bug.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link to="/bugs">
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  View all bugs
                </button>
              </Link>
            </div>

            {/* Sprint Highlights */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">
                Sprint Retrospective Highlights
              </h2>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>Improve test coverage on the mobile app.</li>
                <li>Address frequent crashes on submission.</li>
                <li>Better documentation for REST APIs.</li>
                <li>Schedule daily standups for dev and QA teams.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-8 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-xl"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-6">Add New Project</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block font-semibold mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="project_name"
                  name="project_name"
                  value={newProject.project_name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block font-semibold mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block font-semibold mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={newProject.startDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block font-semibold mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={newProject.endDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block font-semibold mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={newProject.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold shadow"
              >
                Add Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
