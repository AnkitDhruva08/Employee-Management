import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjectsData,
  fetchEmployees,
  fecthTasks,
  loadTaskTags,
} from "../utils/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Input from "../components/input/Input";
import Select from "react-select";
import CkEditor from "../components/editor/CkEditor";
import Swal from "sweetalert2";
import { PlusCircle, Pencil, Trash2, X, Info, ChevronRight, Users, User, GitBranch, CalendarDays, BarChart4, ClipboardList } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";

const CreateTask = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [taskTags, setTaskTags] = useState([]);

  const [formData, setFormData] = useState({
    task_name: "",
    teamLead: null,
    project: null,
    status: null,
    progress: 0,
    members: [],
    description: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const dashboard = await fetchDashboard(token);
      const proj = await fetchProjectsData(token);
      const taskData = await fecthTasks(token);
      const emps = await fetchEmployees(token);
      const links = await fetchDashboardLink(token);
      const tagsData = await loadTaskTags(token);

      setQuickLinks(links);
      setDashboardData(dashboard);
      setProjects(proj.results);
      setTasks(taskData);
      setEmployees(emps);
      setTaskTags(tagsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      Swal.fire({
        icon: 'error',
        title: 'Session Expired',
        text: 'Please log in again.',
      }).then(() => {
        localStorage.removeItem("token");
        sessionStorage.clear();
        navigate("/login");
      });
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  // Groups tasks by their status name for display in columns.
  const taskByStatus = useMemo(() => {
    return taskTags.reduce((acc, tag) => {
      acc[tag.name] = tasks.filter((task) => task.status === tag.id);
      return acc;
    }, {});
  }, [tasks, taskTags]);

  const statusOptions = useMemo(() => {
    return taskTags.map((tag) => ({
      value: tag.id,
      label: tag.name,
    }));
  }, [taskTags]);

  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      value: emp.id,
      label: emp.username,
    }));
  }, [employees]);

  const projectOptions = useMemo(() => {
    return projects.map((proj) => ({
      value: proj.id,
      label: proj.project_name,
    }));
  }, [projects]);

  const allowedCompletedDestinations = ["In Progress", "Testing", "On Hold"];
  const restrictedNewSourceStatuses = ["Completed", "In Progress", "Testing"];

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColName = source.droppableId;
    const destColName = destination.droppableId;

    const taskId = parseInt(draggableId);
    const draggedTask = tasks.find((task) => task.id === taskId);

    if (!draggedTask) return;

    const destStatusTag = taskTags.find(tag => tag.name === destColName);
    if (!destStatusTag) {
      Swal.fire("Error", "Invalid destination status.", "error");
      return;
    }
    const newStatusId = destStatusTag.id;

    const sourceStatusTag = taskTags.find(t => t.id === draggedTask.status);

    if (
      sourceStatusTag && sourceStatusTag.name === "Completed" &&
      !allowedCompletedDestinations.includes(destColName)
    ) {
      Swal.fire(
        "Invalid Move",
        "Completed tasks can only be moved to In Progress, Testing, or On Hold.",
        "warning"
      );
      return;
    }

    if (
      sourceStatusTag && restrictedNewSourceStatuses.includes(sourceStatusTag.name) &&
      destColName === "New"
    ) {
      Swal.fire(
        "Invalid Move",
        `${sourceStatusTag.name} tasks cannot be moved back to New.`,
        "warning"
      );
      return;
    }

    setTasks(prevTasks =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatusId } : task
      )
    );

    try {
      const response = await fetch(
        `http://localhost:8000/api/task-management/${taskId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatusId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      Swal.fire("Error", "Could not update task status", "error");
      setTasks(tasks); // Revert state if API call fails
    }
  };

  const openModal = (mode, taskData = null) => {
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === "edit" || mode === "view") {
      setSelectedTask(taskData);
      setFormData({
        task_name: taskData.task_name,
        teamLead: employeeOptions.find(opt => opt.value === taskData.team_lead) || null,
        project: projectOptions.find(opt => opt.value === taskData.project) || null,
        status: taskData.status,
        progress: taskData.progress,
        members: (taskData.members || []).map((id) =>
          employeeOptions.find((emp) => emp.value === id)
        ).filter(Boolean),
        description: taskData.description,
      });
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
      setSelectedTask(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTask = async () => {
    if (
      !formData.task_name.trim() ||
      !formData.teamLead ||
      !formData.status ||
      !formData.project ||
      formData.members.length === 0 ||
      !formData.description.trim()
    ) {
      Swal.fire("Validation Error", "Please fill in all required fields.", "warning");
      return;
    }

    const payload = {
      task_name: formData.task_name,
      team_lead: formData.teamLead.value,
      project: formData.project.value,
      status: formData.status,
      progress: parseInt(formData.progress),
      members: formData.members.map((m) => m.value),
      description: formData.description,
    };

    try {
      const response = await fetch("http://localhost:8000/api/task-management/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add task.");
      }

      const newTask = await response.json();
      setTasks((prevTasks) => [...prevTasks, newTask]);
      closeModal();
      Swal.fire("Success", "Task added successfully!", "success");
    } catch (err) {
      console.error("Add task error:", err);
      Swal.fire("Error", err.message || "Something went wrong while adding the task.", "error");
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (
      !formData.task_name.trim() ||
      !formData.teamLead ||
      !formData.status ||
      !formData.project ||
      formData.members.length === 0 ||
      !formData.description.trim()
    ) {
      Swal.fire("Validation Error", "Please fill in all required fields.", "warning");
      return;
    }

    const payload = {
      task_name: formData.task_name,
      team_lead: formData.teamLead.value,
      project: formData.project.value,
      status: formData.status,
      progress: parseInt(formData.progress),
      members: formData.members.map((m) => m.value),
      description: formData.description,
    };

    try {
      const response = await fetch(
        `http://localhost:8000/api/task-management/${selectedTask.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update task.");
      }

      const updatedTask = await response.json();
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      closeModal();
      Swal.fire("Success", "Task updated successfully!", "success");
    } catch (err) {
      console.error("Update task error:", err);
      Swal.fire("Error", err.message || "Something went wrong while updating the task.", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:8000/api/task-management/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete task.");

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      setSelectedTask(null);
      Swal.fire("Deleted!", "The task has been removed.", "success");
    } catch (error) {
      Swal.fire("Error", "Could not delete task.", "error");
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 75) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStatusTagColorClass = (statusId) => {
    const tag = taskTags.find(t => t.id === statusId);
    return tag?.color || "text-gray-600";
  };

  let logoUrl = "https://placehold.co/48x48/cccccc/ffffff?text=Logo";
  if (dashboardData && dashboardData.company_logo) {
    const rawLogoPath = dashboardData.company_logo;
    logoUrl = rawLogoPath.startsWith("http")
      ? rawLogoPath
      : `http://localhost:8000/${rawLogoPath.startsWith("media/") ? "" : "media/"
      }${rawLogoPath}`;
  }

  console.log('logoUrl ==<<>>', logoUrl)
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 font-sans">
      <aside className="bg-gray-800 text-white w-full lg:w-64 p-6 flex flex-col shadow-2xl relative z-20">
        {dashboardData && (
          <div className="flex items-center justify-center mb-8 pt-4">
            <img
              src={logoUrl}
              alt={dashboardData.company || "Company Name"}
              className="rounded-full object-cover border-4 border-indigo-500 shadow-xl w-32 h-32"
            />
          </div>
        )}
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex flex-col flex-1 bg-gray-50">
        <Header title="Task Board" />
        <main className="p-6 md:p-8 flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <ClipboardList size={32} className="text-indigo-600" /> Task Board
            </h1>
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              <PlusCircle size={20} />
              <span className="text-lg font-medium hidden sm:inline-block">Add New Task</span>
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex pb-6 gap-6 overflow-x-auto scrollbar-custom">
  {taskTags.map((tag) => (
    <Droppable droppableId={tag.name} key={tag.id}>
      {(provided, snapshot) => (
        <div
          className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-xl flex-shrink-0 border transition-all duration-300 ease-in-out scrollbar-custom ${
            snapshot.isDraggingOver
              ? "border-indigo-400 ring-2 ring-indigo-200 scale-[1.01]"
              : "border-transparent"
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            width: 320,
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          <h2
            className={`text-xl font-bold mb-4 flex items-center justify-between py-2 rounded-lg ${getStatusTagColorClass(
              tag.id
            )}`}
          >
            <span className="flex items-center gap-2">
              <Info
                size={22}
                className={getStatusTagColorClass(tag.id).replace(
                  "text-",
                  "stroke-"
                )}
              />
              {tag.name}
            </span>
            <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 font-semibold shadow-inner">
              {(taskByStatus[tag.name] || []).length}
            </span>
          </h2>

          <div className="space-y-4">
            {(taskByStatus[tag.name] || []).map((task, index) => (
              <Draggable
                draggableId={task.id.toString()}
                index={index}
                key={task.id}
              >
                {(provided, snapshot) => (
                  <div
                    className={`bg-white border border-gray-200 p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out cursor-grab active:cursor-grabbing transform hover:-translate-y-0.5 ${
                      snapshot.isDragging
                        ? "shadow-2xl ring-2 ring-indigo-300 bg-indigo-50"
                        : ""
                    }`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => openModal("view", task)}
                  >
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight break-words">
                      {task.task_name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 break-words">
                      <p className="flex items-center gap-2">
                        <GitBranch size={16} className="text-blue-500" />
                        <span className="font-medium">
                          {task.project_name || "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <User size={16} className="text-purple-500" />
                        Lead:{" "}
                        <span className="font-medium">
                          {task.team_lead_name || "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users size={16} className="text-green-500" />
                        Members:{" "}
                        <span className="font-medium">
                          {task.member_names || "N/A"}
                        </span>
                      </p>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      <div
                        className={`${getProgressColor(
                          task.progress
                        )} h-2.5 rounded-full transition-all duration-300 ease-out`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1 font-mono">
                      {task.progress}%
                    </p>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  ))}
</div>

</DragDropContext>


          {isModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-xl p-8 min-h-[400px] max-h-[95vh] overflow-y-auto w-full max-w-3xl shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {modalMode === "add"
                      ? "Create New Task"
                      : modalMode === "edit"
                        ? "Edit Task"
                        : selectedTask?.task_name || "Task Details"}
                  </h2>
                  <div className="flex gap-3">
                    {modalMode === "view" && selectedTask && (
                      <>
                        <button
                          onClick={() => openModal("edit", selectedTask)}
                          className="p-3 rounded-full text-indigo-600 hover:bg-indigo-50 transition duration-200 group"
                          title="Edit Task"
                        >
                          <Pencil size={22} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDelete(selectedTask.id)}
                          className="p-3 rounded-full text-red-600 hover:bg-red-50 transition duration-200 group"
                          title="Delete Task"
                        >
                          <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={closeModal}
                      className="p-3 rounded-full text-gray-600 hover:bg-gray-100 transition duration-200 group"
                      title="Close"
                    >
                      <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>

                {modalMode === "view" && selectedTask ? (
                  <div className="space-y-5 text-gray-800">
                    <p className="flex items-center gap-3 text-lg">
                      <GitBranch size={20} className="text-blue-600" />
                      <strong>Project:</strong> {selectedTask.project_name}
                    </p>
                    <p className="flex items-center gap-3 text-lg">
                      <User size={20} className="text-purple-600" />
                      <strong>Team Lead:</strong> {selectedTask.team_lead_name}
                    </p>
                    <p className="flex items-center gap-3 text-lg">
                      <BarChart4 size={20} className="text-orange-600" />
                      <strong>Status:</strong>{" "}
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${getStatusTagColorClass(selectedTask.status).replace('text-', 'bg-')} bg-opacity-10`} style={{ color: getStatusTagColorClass(selectedTask.status) }}>
                        {taskTags.find(tag => tag.id === selectedTask.status)?.name || "N/A"}
                      </span>
                    </p>
                    <p className="flex items-center gap-3 text-lg">
                      <ChevronRight size={20} className="text-emerald-600" />
                      <strong>Progress:</strong> {selectedTask.progress}%
                    </p>
                    <p className="flex items-center gap-3 text-lg">
                      <Users size={20} className="text-cyan-600" />
                      <strong>Members:</strong> {selectedTask.member_names || "N/A"}
                    </p>
                    <div>
                      <strong className="flex items-center gap-3 text-lg mb-2">
                        <Info size={20} className="text-gray-600" />
                        Description:
                      </strong>
                      <div
                        className="prose prose-sm md:prose-base max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto h-48"
                        dangerouslySetInnerHTML={{
                          __html: selectedTask.description,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <p className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        Created: {new Date(selectedTask.created_at).toLocaleString()}
                      </p>
                      <p className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        Updated: {new Date(selectedTask.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Task Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="task_name"
                        value={formData.task_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Implement user authentication"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={projectOptions}
                        value={formData.project}
                        onChange={(selected) =>
                          setFormData({ ...formData, project: selected })
                        }
                        placeholder="Select Project"
                        isClearable
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db', 
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#a78bfa', 
                            },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#e0e7ff' : null, 
                            color: '#374151', 
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: '#e0e7ff',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: '#4338ca', 
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: '#4338ca',
                            '&:hover': {
                              backgroundColor: '#a78bfa',
                              color: 'white',
                            },
                          }),
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Team Lead <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={employeeOptions}
                        value={formData.teamLead}
                        onChange={(selected) =>
                          setFormData({ ...formData, teamLead: selected })
                        }
                        placeholder="Select Team Lead"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#a78bfa',
                            },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#e0e7ff' : null,
                            color: '#374151',
                          }),
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={statusOptions}
                        value={statusOptions.find((option) => option.value === formData.status)}
                        onChange={(selected) =>
                          setFormData({ ...formData, status: selected.value })
                        }
                        placeholder="Select Status"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#a78bfa',
                            },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#e0e7ff' : null,
                            color: '#374151',
                          }),
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Progress % <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="progress"
                        type="number"
                        value={formData.progress}
                        onChange={handleFormChange}
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Team Members <span className="text-red-500">*</span>
                      </label>
                      <Select
                        isMulti
                        options={employeeOptions}
                        value={formData.members}
                        onChange={(selected) =>
                          setFormData({ ...formData, members: selected })
                        }
                        placeholder="Select Team Members"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#a78bfa',
                            },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#e0e7ff' : null,
                            color: '#374151',
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: '#e0e7ff',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: '#4338ca',
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: '#4338ca',
                            '&:hover': {
                              backgroundColor: '#a78bfa',
                              color: 'white',
                            },
                          }),
                        }}
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <CkEditor
                        value={formData.description}
                        onChange={(data) =>
                          setFormData({ ...formData, description: data })
                        }
                      />
                    </div>

                    <div className="col-span-full flex flex-col sm:flex-row gap-4 mt-4">
                      <button
                        type="button"
                        className="flex-1 p-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                        onClick={
                          modalMode === "add" ? handleAddTask : handleUpdateTask
                        }
                      >
                        {modalMode === "add" ? "Create Task" : "Update Task"}
                      </button>

                      <button
                        type="button"
                        className="flex-1 p-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateTask;