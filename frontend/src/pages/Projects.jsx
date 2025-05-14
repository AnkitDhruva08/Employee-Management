import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";

const Projects = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "In Progress",
  });

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

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
      if (!isSuperUser) {
        const links = await fetchDashboardLink(token);
        setQuickLinks(links.data || links);
      }
      const empDashboard = await fetchDashboard(token);
      setDashboardData(empDashboard);
      setProjects(empDashboard.projects || []);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-orange-500";
      case "Done":
        return "bg-green-500";
      case "Blocked":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.description.trim() || !newProject.startDate || !newProject.endDate || !newProject.status) {
      alert("Please fill in all fields");
      return;
    }
    setProjects([...projects, newProject]);
    setModalOpen(false);
    setNewProject({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "In Progress",
    });
  };

  if (error) {
    return <div className="text-red-600 text-center mt-10 text-xl animate-pulse">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData.company}</h2>
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>
      <main className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="px-8 py-6 overflow-auto flex-1">
          <h2 className="text-3xl font-bold text-blue-800 mb-6">Projects</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-1">Total Projects</h3>
              <p className="text-3xl font-extrabold">{projects.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-1">Active Projects</h3>
              <p className="text-3xl font-extrabold">{projects.filter((p) => p.status === "In Progress").length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-1">Completed Projects</h3>
              <p className="text-3xl font-extrabold">{projects.filter((p) => p.status === "Done").length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-1">Blocked Projects</h3>
              <p className="text-3xl font-extrabold">{projects.filter((p) => p.status === "Blocked").length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Project Status Distribution</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                [Pie Chart Placeholder]
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Projects Over Time</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                [Line Chart Placeholder]
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold shadow" onClick={() => setModalOpen(true)}>
              + Add Project
            </button>
          </div>

          <div className="overflow-x-auto shadow rounded-lg bg-white">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-normal">{project.name}</td>
                    <td className="px-6 py-4 whitespace-normal">{project.description}</td>
                    <td className="px-6 py-4">{project.startDate}</td>
                    <td className="px-6 py-4">{project.endDate}</td>
                    <td className="px-6 py-4">
                      <span className={`${getStatusBadge(project.status)} text-white rounded-full px-3 py-1 text-xs font-semibold`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
                <label htmlFor="name" className="block font-semibold mb-1">Project Name</label>
                <input type="text" id="name" name="name" value={newProject.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="description" className="block font-semibold mb-1">Description</label>
                <textarea id="description" name="description" value={newProject.description} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block font-semibold mb-1">Start Date</label>
                  <input type="date" id="startDate" name="startDate" value={newProject.startDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                  <label htmlFor="endDate" className="block font-semibold mb-1">End Date</label>
                  <input type="date" id="endDate" name="endDate" value={newProject.endDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block font-semibold mb-1">Status</label>
                <select id="status" name="status" value={newProject.status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold shadow">
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
