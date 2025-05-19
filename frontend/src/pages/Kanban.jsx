import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const projectsData = [
  { id: 1, name: "New Website Launch", teamLead: "Alice Johnson", status: "In Progress", progress: 60, members: ["Alice Johnson", "Frank Wright", "Emily Davis"] },
  { id: 2, name: "Mobile App Development", teamLead: "Bob Smith", status: "New", progress: 10, members: ["Bob Smith", "Frank Wright"] },
  { id: 3, name: "Marketing Campaign", teamLead: "Carla Gomez", status: "Completed", progress: 100, members: ["Carla Gomez", "Emily Davis"] },
  { id: 4, name: "Customer Support Upgrade", teamLead: "David Lee", status: "On Hold", progress: 40, members: ["David Lee"] },
  { id: 5, name: "SEO Optimization", teamLead: "Emily Davis", status: "In Progress", progress: 30, members: ["Emily Davis", "Frank Wright"] }
];

const statuses = [
  { key: "New", label: "New", color: "blue-500" },
  { key: "In Progress", label: "In Progress", color: "yellow-400" },
  { key: "Completed", label: "Completed", color: "green-500" },
  { key: "On Hold", label: "On Hold", color: "gray-500" },
];

function getInitials(name) {
  const names = name.split(" ");
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  return initials;
}

export default function KanbanDashboard() {
  const [projects, setProjects] = useState(projectsData);
  const [selectedProject, setSelectedProject] = useState(null);

  function openModal(project) {
    setSelectedProject(project);
  }

  function closeModal() {
    setSelectedProject(null);
  }

  // Group projects by status for rendering
  const projectsByStatus = statuses.reduce((acc, status) => {
    acc[status.key] = projects.filter(p => p.status === status.key);
    return acc;
  }, {});

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) return;

    // Dropped in same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Update project status and order
    setProjects(prevProjects => {
      // Clone current projects array
      const updatedProjects = Array.from(prevProjects);

      // Find dragged project
      const draggedProjectIndex = updatedProjects.findIndex(
        (p) => p.id.toString() === draggableId
      );
      if (draggedProjectIndex === -1) return prevProjects;

      // Update status to new column
      updatedProjects[draggedProjectIndex] = {
        ...updatedProjects[draggedProjectIndex],
        status: destination.droppableId
      };

      return updatedProjects;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Project Management Kanban Dashboard
        </h1>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-6">
          {statuses.map(({ key, label, color }) => (
            <Droppable droppableId={key} key={key}>
              {(provided, snapshot) => (
                <div
                  className={`flex-1 bg-white rounded-lg shadow p-4 flex flex-col max-h-[80vh] overflow-y-auto
                    ${snapshot.isDraggingOver ? "bg-indigo-100" : ""}
                  `}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2 className={`text-lg font-semibold mb-4 text-${color}`}>
                    {label}
                  </h2>

                  {projectsByStatus[key].length === 0 ? (
                    <p className="text-gray-400">No projects</p>
                  ) : (
                    projectsByStatus[key].map((project, index) => (
                      <Draggable
                        draggableId={project.id.toString()}
                        index={index}
                        key={project.id}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openModal(project)}
                            className={`cursor-pointer bg-gray-100 rounded-md p-4 mb-4 hover:shadow-lg transition-shadow select-none
                              ${
                                snapshot.isDragging
                                  ? "bg-indigo-300 shadow-lg"
                                  : ""
                              }
                            `}
                            title="Click for details"
                          >
                            <h3 className="font-semibold text-gray-800">
                              {project.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Team Lead: {project.teamLead}
                            </p>
                            <div className="w-full bg-gray-300 rounded-full h-3 mt-2 overflow-hidden">
                              <div
                                className={`h-3 rounded-full bg-${color}`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.progress}% Complete
                            </p>
                            <div className="mt-2 text-xs text-gray-600">
                              Lead Initials: {getInitials(project.teamLead)}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 focus:outline-none text-2xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h3
              id="modal-title"
              className="text-xl font-bold mb-4 text-gray-800"
            >
              {selectedProject.name}
            </h3>
            <p>
              <strong>Team Lead:</strong> {selectedProject.teamLead}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`inline-block px-2 py-1 rounded text-white bg-${
                  statuses.find((s) => s.key === selectedProject.status)?.color
                }`}
              >
                {selectedProject.status}
              </span>
            </p>
            <div className="mt-2">
              <strong>Progress:</strong>
              <div className="w-full bg-gray-300 rounded-full h-4 mt-1 overflow-hidden">
                <div
                  className={`h-4 rounded-full bg-${
                    statuses.find((s) => s.key === selectedProject.status)
                      ?.color
                  }`}
                  style={{ width: `${selectedProject.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProject.progress}% Complete
              </p>
            </div>
            <div className="mt-4">
              <strong>Involved Members:</strong>
              <ul className="list-disc list-inside text-gray-700 mt-1">
                {selectedProject.members.map((member, idx) => (
                  <li key={idx}>{member}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
