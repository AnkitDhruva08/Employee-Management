import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjects,
} from "../utils/api";
import Swal from "sweetalert2";
import Select from "react-select";

const statusColors = {
  Open: "bg-red-500",
  "In Progress": "bg-orange-400",
  Done: "bg-green-500",
  Blocked: "bg-red-700",
};

const priorityColors = {
  Low: "bg-green-500",
  Medium: "bg-orange-400",
  High: "bg-red-500",
  Critical: "bg-red-800",
};

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Blocked", label: "Blocked" },
  { value: "Done", label: "Done" },
];

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

const dummyBugs = [
  {
    id: 124,
    title: "Login button not responsive",
    status: "Open",
    priority: "High",
    assignedTo: "John Smith",
    created: "2024-04-15",
    projectId: 1,
  },
  {
    id: 130,
    title: "Crash on submitting form",
    status: "Blocked",
    priority: "Critical",
    assignedTo: "Lisa Stern",
    created: "2024-04-12",
    projectId: 2,
  },
  {
    id: 135,
    title: "UI misalignment on mobile",
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Alice Brown",
    created: "2024-04-10",
    projectId: 1,
  },
  {
    id: 140,
    title: "Data sync failure",
    status: "Open",
    priority: "High",
    assignedTo: "Mark Wilson",
    created: "2024-04-17",
    projectId: 2,
  },
];

const BugTracker = () => {
  const [bugs, setBugs] = useState(dummyBugs);
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    status: "",
    priority: "",
    assignedTo: [],
  });

  const navigate = useNavigate();
  const { id } = useParams();

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const HeaderTitle = "Bugs & Testing";

  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token);
      const empDashboard = await fetchDashboard(token);
      const projectsData = await fetchProjects(token);

      setProjects(projectsData);
      setEmployees([
        { id: 1, name: "John Smith" },
        { id: 2, name: "Lisa Stern" },
        { id: 3, name: "Alice Brown" },
        { id: 4, name: "Mark Wilson" },
      ]);
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleAddBug = (e) => {
    e.preventDefault();
    const newBug = {
      id: bugs.length + 100,
      title: formData.title,
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo.map((a) => a.label).join(", "),
      created: new Date().toISOString().split("T")[0],
      projectId: formData.projectId,
    };
    setBugs((prev) => [...prev, newBug]);
    setFormData({
      title: "",
      projectId: "",
      status: "",
      priority: "",
      assignedTo: [],
    });
    setShowModal(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company}</h2>
        <ProjectSidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Header title={HeaderTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Bugs & Testing
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
            >
              Add Bug
            </button>
          </div>

          <div className="mb-4 w-1/3">
            <label className="block font-semibold mb-1">Filter by Project</label>
            <Select
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(option) => setSelectedProjectId(option?.value)}
              isClearable
              placeholder="Select a project"
            />
          </div>

          <div className="overflow-x-auto shadow rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="bg-gray-100">
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bugs
                  .filter(
                    (bug) =>
                      !selectedProjectId || bug.projectId === selectedProjectId
                  )
                  .map((bug) => (
                    <tr key={bug.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">#{bug.id}</td>
                      <td className="p-3">{bug.title}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-white text-xs font-semibold rounded-full ${statusColors[bug.status]}`}
                        >
                          {bug.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-white text-xs font-semibold rounded-full ${priorityColors[bug.priority]}`}
                        >
                          {bug.priority}
                        </span>
                      </td>
                      <td className="p-3">{bug.assignedTo}</td>
                      <td className="p-3">{bug.created}</td>
                      <td className="p-3 space-x-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">
                          Edit
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed z-50 top-1/2 left-1/2 w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">
              Add New Bug
            </h3>
            <form onSubmit={handleAddBug} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Project</label>
                <Select
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  onChange={(option) =>
                    setFormData({ ...formData, projectId: option?.value })
                  }
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <Select
                  options={statusOptions}
                  onChange={(option) =>
                    setFormData({ ...formData, status: option?.value })
                  }
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Priority</label>
                <Select
                  options={priorityOptions}
                  onChange={(option) =>
                    setFormData({ ...formData, priority: option?.value })
                  }
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Assigned To</label>
                <Select
                  options={employees.map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                  isMulti
                  onChange={(options) =>
                    setFormData({ ...formData, assignedTo: options })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Add Bug
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default BugTracker;
