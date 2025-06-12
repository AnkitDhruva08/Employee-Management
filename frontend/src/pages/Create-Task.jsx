import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjectsData,
  fetchEmployees,
  fecthTasks,
  fetchTaskSideBar,
  fetchProjectSidebar, 
} from "../utils/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Input from "../components/input/Input";
import Select from "react-select";
import CkEditor from "../components/editor/CkEditor";
import Swal from "sweetalert2";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";

const statuses = [
  { key: "New", label: "New" },
  { key: "In Progress", label: "In Progress" },
  { key: "Testing", label: "Testing" },
  { key: "Completed", label: "Completed" },
  { key: "On Hold", label: "On Hold" },
];

const CreateTask = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTask] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [isOpen, setIsOpen] = useState(false) 
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedTask, setselectedTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    task_name: "",
    teamLead: null,
    project_name: null,
    status: null,
    progress: 0,
    members: [],
    description: "",
  });


  const [tabForm, setTabForm] = useState({
    tabStatus : '',
    tabColor : '',
    
  })
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const dashboard = await fetchDashboard(token);
      const proj = await fetchProjectsData(token);
      const taskData = await fecthTasks(token);
      const emps = await fetchEmployees(token);
      const links = await fetchDashboardLink(token);

      setQuickLinks(links);

      setDashboardData(dashboard);
      setProjects(proj.results);
      setTask(taskData);
      setEmployees(emps);
    } catch (err) {
      console.error("Error:", err);
      localStorage.removeItem("token");
      sessionStorage.clear();
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const taskByStatus = statuses.reduce((acc, s) => {
    acc[s.key] = tasks?.filter((p) => p.status === s.key);
    return acc;
  }, {});

  const allowedCompletedDestinations = ["In Progress", "Testing", "On Hold"];
  const restrictedNewSourceStatuses = ["Completed", "In Progress", "Testing"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTabForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // add tab
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", tabForm);
    setIsOpen(false);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (sourceCol === destCol && source.index === destination.index) return;

    const taskId = parseInt(draggableId);
    const draggedTask = tasks.find((task) => task.id === taskId);

    if (
      draggedTask.status === "Completed" &&
      !allowedCompletedDestinations.includes(destCol)
    ) {
      Swal.fire(
        "Invalid Move",
        "Completed tasks can only be moved to In Progress, Testing, or On Hold.",
        "warning"
      );
      return;
    }

    if (
      restrictedNewSourceStatuses.includes(draggedTask.status) &&
      destCol === "New"
    ) {
      Swal.fire(
        "Invalid Move",
        `${draggedTask.status} tasks cannot be moved back to New.`,
        "warning"
      );
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: destCol } : task
    );
    setTask(updatedTasks);

    try {
      const response = await fetch(
        `http://localhost:8000/api/task-management/${taskId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: destCol }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error updating task status:", error);
      Swal.fire("Error", "Could not update task status", "error");

      setTask(tasks);
    }
  };

  const handleAddTask = async () => {
    if (
      !formData.task_name.trim() ||
      !formData.teamLead ||
      !formData.status ||
      !formData.progress ||
      !formData.members ||
      !formData.description
    ) {
      Swal.fire(
        "Validation Error",
        "Please fill in all required fields.",
        "warning"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/task-management/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error", errorData.message || "Failed to add bug", "error");
        return;
      }

      const responseData = await response.json();
      const id = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;

      setTask([
        ...tasks,
        {
          id,
          name: formData.task_name,
          teamLead: formData.teamLead.value,
          project_name: formData.project_name?.label || "",
          status: formData.status.value,
          progress: parseInt(formData.progress) || 0,
          members: formData.members.map((m) => m.label),
          description: formData.description,
        },
      ]);

      setIsAddModalOpen(false);
      setFormData({
        task_name: "",
        teamLead: null,
        project_name: null,
        status: null,
        progress: 0,
        members: [],
        description: "",
      });

      Swal.fire("Success", "Task added successfully!", "success");
    } catch (err) {
      console.error("Add task error:", err);
      Swal.fire(
        "Error",
        "Something went wrong while adding the task.",
        "error"
      );
    }
  };

  const openModal = (mode, tasksData = null) => {
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === "edit" || mode === "view") {
      setFormData({
        task_name: tasksData.task_name,
        teamLead: {
          value: tasksData.team_lead,
          label: tasksData.team_lead_name,
        },
        project: { value: tasksData.project, label: tasksData.project_name },
        status: { value: tasksData.status, label: tasksData.status },
        progress: tasksData.progress,
        members: (tasksData.members || []).map((id) => {
          const emp = employees.find((e) => e.id === id);
          return { value: emp?.id, label: emp?.username };
        }),
        description: tasksData.description,
      });
      setselectedTask(tasksData);
    } else {
      setFormData({
        task_name: "",
        teamLead: null,
        project: null,
        status: null,
        progress: 0,
        members: [],
        description: "",
      });
      setselectedTask(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setselectedTask(null);
    setFormData({
      task_name: "",
      teamLead: null,
      project: null,
      status: null,
      progress: 0,
      members: [],
      description: "",
    });
  };

  const handleUpdateTask = async () => {
    if (
      !formData.task_name.trim() ||
      !formData.teamLead ||
      !formData.status ||
      !formData.progress ||
      !formData.members ||
      !formData.description
    ) {
      Swal.fire(
        "Validation Error",
        "Please fill in all required fields.",
        "warning"
      );
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/task-management/${selectedTask.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error", errorData.message || "Failed to add bug", "error");
        return;
      }

      Swal.fire("Success", "Task Updated successfully!", "success");
      window.location.reload();
    } catch (err) {
      console.error("Add task error:", err);
      Swal.fire(
        "Error",
        "Something went wrong while adding the task.",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Task?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/task-management/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete task.");

      setTask(tasks.filter((task) => task.id !== id));
      setselectedTask(null);
      Swal.fire("Deleted!", "The task has been removed.", "success");
    } catch (error) {
      Swal.fire("Error", "Could not delete task.", "error");
    }
  };

  let logoUrl = "https://placehold.co/48x48/cccccc/ffffff?text=Logo";
  if (dashboardData && dashboardData.company_logo) {
    const rawLogoPath = dashboardData.company_logo;
    logoUrl = rawLogoPath.startsWith("http")
      ? rawLogoPath
      : `http://localhost:8000/${
          rawLogoPath.startsWith("media/") ? "" : "media/"
        }${rawLogoPath}`;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <aside className="bg-gray-800 text-white w-full lg:w-64 p-6 flex flex-col">
        {dashboardData && (
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={logoUrl}
              alt={dashboardData.company || "Company Name"}
              style={{ width: "9rem", height: "9rem" }}
              className="rounded-full object-cover border-4 border-indigo-500 shadow-md"
            />
          </div>
        )}

        <Sidebar quickLinks={quickLinks} />
      </aside>
      <div className="flex flex-col flex-1 bg-gray-500">
        <Header title="Task Dashboard" />
        <main className="p-6 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
  {/* Add Task Button */}
  <button
    onClick={() => openModal("add")}
    className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200"
  >
    <span className="text-lg font-medium">+ Add Task</span>
  </button>

  {/* Open Tab Form Button */}
  <button
    onClick={() => setIsOpen(true)}
    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
  >
    <span className="text-lg font-medium">Open Tab Form</span>
  </button>
</div>


          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-4 ">
              {statuses.map(({ key, label }) => (
                <Droppable droppableId={key} key={key}>
                  {(provided, snapshot) => (
                    <div
                      className={`bg-white rounded p-4 shadow border-2 transition-all ${
                        snapshot.isDraggingOver
                          ? "border-blue-400"
                          : "border-transparent"
                      }`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        maxHeight: "calc(100vh - 200px)",
                        overflowY: "auto",
                        width: 250,
                      }}
                    >
                      <h2 className={`text-md font-semibold text-gray-800`}>
                        {label}
                      </h2>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                        {(taskByStatus[key] || []).length}
                      </span>
                      {taskByStatus[key]?.map((project, index) => (
                        <Draggable
                          draggableId={project.id.toString()}
                          index={index}
                          key={project.id}
                        >
                          {(provided, snapshot) => (
                            <div
                              className={`bg-white border border-gray-200 p-4 rounded-lg mb-3 shadow-sm hover:shadow-md transition ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setselectedTask(project)}
                            >
                              <h3 className="font-semibold">
                                {project.task_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Lead: {project.team_lead_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Project Name : {project.project_name}
                              </p>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Status: {project.status}
                                </p>
                              </div>
                              <div className="bg-gray-300 h-2 rounded mt-2">
                                <div
                                  className={`h-2 rounded`}
                                  style={{
                                    width: `${project.progress}%`,
                                    backgroundColor:
                                      project.status === "New"
                                        ? "#3B82F6"
                                        : project.status === "In Progress"
                                        ? "#F97316"
                                        : project.status === "Testing"
                                        ? "#EAB308"
                                        : project.status === "Completed"
                                        ? "#22C55E"
                                        : project.status === "On Hold"
                                        ? "#EF4444"
                                        : "#9CA3AF",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>

          {selectedTask && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50"
              onClick={() => setselectedTask(null)}
            >
              <div
                className="bg-white rounded p-6 w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {selectedTask.task_name}
                  </h2>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal("edit", selectedTask)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTask.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p>
                  <strong>Lead:</strong> {selectedTask.team_lead_name}
                </p>
                <p>
                  <strong>Project Name:</strong> {selectedTask.project_name}
                </p>
                <p>
                  <strong>Status:</strong> {selectedTask.status}
                </p>
                <p>
                  <strong>Progress:</strong> {selectedTask.progress}%
                </p>
                <p>
                  <strong>Members:</strong> {selectedTask.member_names}
                </p>
                <p>
                  <strong>Description:</strong> {selectedTask.description}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedTask.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated:</strong>{" "}
                  {new Date(selectedTask.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {isModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded p-6 min-h-[400px] max-h-[600px] overflow-y-auto min-w-[300px] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-4">
                  {modalMode === "add" ? "Add New Task" : "Update Task"}
                </h2>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Task Name</label>
                  <Input
                    name="task_name"
                    value={formData.task_name}
                    onChange={(e) =>
                      setFormData({ ...formData, task_name: e.target.value })
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Project</label>
                  <Select
                    options={projects.map((proj) => ({
                      value: proj.id,
                      label: proj.project_name,
                    }))}
                    value={formData.project}
                    onChange={(selected) =>
                      setFormData({ ...formData, project: selected })
                    }
                    placeholder="Select Project"
                    isClearable
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Team Lead</label>
                  <Select
                    options={employees.map((emp) => ({
                      value: emp.id,
                      label: emp.username,
                    }))}
                    value={formData.teamLead}
                    onChange={(selected) =>
                      setFormData({ ...formData, teamLead: selected })
                    }
                    placeholder="Select Team Lead"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Status</label>
                  <Select
                    options={statuses}
                    value={formData.status}
                    onChange={(selected) =>
                      setFormData({ ...formData, status: selected })
                    }
                    placeholder="Select Status"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Progress %</label>
                  <Input
                    name="progress"
                    type="number"
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData({ ...formData, progress: e.target.value })
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">
                    Team Members
                  </label>
                  <Select
                    isMulti
                    options={employees.map((emp) => ({
                      value: emp.id,
                      label: emp.username,
                    }))}
                    value={formData.members}
                    onChange={(selected) =>
                      setFormData({ ...formData, members: selected })
                    }
                    placeholder="Select Team Members"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-semibold">
                    Description
                  </label>
                  <CkEditor
                    value={formData.description}
                    onChange={(data) =>
                      setFormData({ ...formData, description: data })
                    }
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    className="flex-1 p-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300"
                    onClick={
                      modalMode === "add" ? handleAddTask : handleUpdateTask
                    }
                  >
                    {modalMode === "add" ? "Add Task" : "Update Task"}
                  </button>

                  <button
                    className="flex-1 p-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

    {/* tab modal */}
    {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Tab Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Tab Status</label>
                <input
                  type="text"
                  name="tabStatus"
                  value={tabForm.tabStatus}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
                  placeholder="Enter tab status"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Tab Color</label>
                <input
                  type="text"
                  name="tabColor"
                  value={tabForm.tabColor}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
                  placeholder="Enter tab color"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTask;
