import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import TaskSidebar from "../components/sidebar/TaskSideBar";
import { fetchDashboard } from "../utils/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const projectsData = [
  { id: 1, name: "New Website Launch", teamLead: "Alice Johnson", status: "In Progress", progress: 60, members: ["Alice Johnson", "Frank Wright", "Emily Davis"] },
  { id: 2, name: "Mobile App Development", teamLead: "Bob Smith", status: "New", progress: 10, members: ["Bob Smith", "Frank Wright"] },
  { id: 3, name: "Marketing Campaign", teamLead: "Carla Gomez", status: "Completed", progress: 100, members: ["Carla Gomez", "Emily Davis"] },
  { id: 4, name: "Customer Support Upgrade", teamLead: "David Lee", status: "On Hold", progress: 40, members: ["David Lee"] },
  { id: 5, name: "SEO Optimization", teamLead: "Emily Davis", status: "In Progress", progress: 30, members: ["Emily Davis", "Frank Wright"] }
];

const statuses = [
  { key: "New", label: "New", color: "blue-500" },
  { key: "In Progress", label: "In Progress", color: "orange-400" },
  { key: "Completed", label: "Completed", color: "green-500" },
  { key: "On Hold", label: "On Hold", color: "yellow-500" },
];

const TaskDahboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState(projectsData);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    teamLead: "",
    status: "New",
    progress: 0,
    members: ""
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const empDashboard = await fetchDashboard(token);
        setDashboardData(empDashboard);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        navigate("/login");
      }
    };
    fetchLinks();
  }, [navigate, token]);

  const projectsByStatus = statuses.reduce((acc, s) => {
    acc[s.key] = projects.filter(p => p.status === s.key);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (sourceCol === destCol) {
      const items = Array.from(projectsByStatus[sourceCol]);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);

      // Reconstruct projects list keeping order intact
      const otherProjects = projects.filter(p => p.status !== sourceCol);
      setProjects([...otherProjects, ...items]);
    } else {
      // Move project to new status
      const updated = projects.map(p =>
        p.id === parseInt(result.draggableId)
          ? { ...p, status: destCol }
          : p
      );
      setProjects(updated);
    }
  };

  const handleAddTask = () => {
    if (!newTask.name.trim() || !newTask.teamLead.trim()) {
      alert("Please fill in project name and team lead.");
      return;
    }
    const id = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    setProjects([
      ...projects,
      {
        id,
        name: newTask.name,
        teamLead: newTask.teamLead,
        status: newTask.status,
        progress: parseInt(newTask.progress) || 0,
        members: newTask.members.split(",").map(m => m.trim()).filter(Boolean),
      },
    ]);
    setIsAddModalOpen(false);
    setNewTask({ name: "", teamLead: "", status: "New", progress: 0, members: "" });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company || "Company Name"}</h2>
        <TaskSidebar />
      </aside>
      <div className="flex flex-col flex-1">
        <Header title="Task Dashboard" />
        <main className="p-6 space-y-4 overflow-hidden">

          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add Task
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4">
              {statuses.map(({ key, label, color }) => (
                <Droppable droppableId={key} key={key}>
                  {(provided, snapshot) => (
                    <div
                      className={`bg-white rounded p-4 shadow border-2 transition-all ${
                        snapshot.isDraggingOver ? 'border-blue-400' : 'border-transparent'
                      }`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        maxHeight: "calc(100vh - 200px)",
                        overflowY: "auto",
                        width: 250,
                      }}
                    >
                      <h2 className={`text-${color} text-md font-semibold`}>{label}</h2>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{projectsByStatus[key].length}</span>
                      {projectsByStatus[key]?.map((project, index) => (
                        <Draggable
                          draggableId={project.id.toString()}
                          index={index}
                          key={project.id}
                        >
                          {(provided, snapshot) => (
                            <div
                              className={`bg-white border border-gray-200 p-4 rounded-lg mb-3 shadow-sm hover:shadow-md transition ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedProject(project)}
                            >
                              <h3 className="font-semibold">{project.name}</h3>
                              <p className="text-sm text-gray-600">Lead: {project.teamLead}</p>
                              <div className="bg-gray-300 h-2 rounded mt-2">
                                <div
                                  className={`bg-${color} h-2 rounded`}
                                  style={{ width: `${project.progress}%` }}
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

          {selectedProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedProject(null)}>
              <div className="bg-white rounded p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{selectedProject.name}</h2>
                <p><strong>Lead:</strong> {selectedProject.teamLead}</p>
                <p><strong>Status:</strong> {selectedProject.status}</p>
                <p><strong>Progress:</strong> {selectedProject.progress}%</p>
                <p><strong>Members:</strong> {selectedProject.members.join(", ")}</p>
              </div>
            </div>
          )}

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsAddModalOpen(false)}>
              <div className="bg-white rounded p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Add New Task</h2>
                <input
                  className="w-full p-2 mb-2 border rounded"
                  placeholder="Project Name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  placeholder="Team Lead"
                  value={newTask.teamLead}
                  onChange={(e) => setNewTask({ ...newTask, teamLead: e.target.value })}
                />
                <select
                  className="w-full p-2 mb-2 border rounded"
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                >
                  {statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <input
                  type="number"
                  className="w-full p-2 mb-2 border rounded"
                  placeholder="Progress %"
                  value={newTask.progress}
                  onChange={(e) => setNewTask({ ...newTask, progress: e.target.value })}
                />
                <input
                  className="w-full p-2 mb-4 border rounded"
                  placeholder="Members (comma separated)"
                  value={newTask.members}
                  onChange={(e) => setNewTask({ ...newTask, members: e.target.value })}
                />
                <button
                  className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TaskDahboard;
