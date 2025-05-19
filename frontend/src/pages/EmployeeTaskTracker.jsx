import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import { fetchDashboard } from "../utils/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const dummyEmployees = [
  { id: 1, name: "John Smith", initials: "JS", project: "Mobile App", task: "Fix login bug", status: "In Progress", date: "2025-05-15" },
  { id: 2, name: "Alice Brown", initials: "AB", project: "Website Redesign", task: "Create wireframes", status: "Done", date: "2025-05-18" },
  { id: 3, name: "Mark Wilson", initials: "MW", project: "API Development", task: "Code review & deploy", status: "Done", date: "2025-05-19" },
  { id: 4, name: "Lisa Stern", initials: "LS", project: "Mobile App", task: "Write test cases", status: "Open", date: "2025-05-16" },
  { id: 5, name: "Tom Dale", initials: "TD", project: "Analytics", task: "Resolve dashboard bug", status: "Blocked", date: "2025-05-15" },
];

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Blocked", label: "Blocked" },
  { value: "Done", label: "Done" },
];

const statusColumns = ["Open", "In Progress", "Blocked", "Done"];

const getStatusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-red-600";
    case "In Progress":
      return "bg-orange-400";
    case "Done":
      return "bg-green-500";
    case "Blocked":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

const EmployeeTaskTracker = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [filters, setFilters] = useState({
    employee: "",
    status: null,
    startDate: null,
    endDate: null,
  });
  const [tasksByStatus, setTasksByStatus] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const grouped = statusColumns.reduce((acc, status) => {
      acc[status] = dummyEmployees.filter((task) => task.status === status);
      return acc;
    }, {});
    setTasksByStatus(grouped);
  }, []);

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

  useEffect(() => {
    const filtered = dummyEmployees.filter((emp) => {
      const matchName = filters.employee
        ? emp.name.toLowerCase().includes(filters.employee.toLowerCase())
        : true;
      const matchStatus = filters.status ? emp.status === filters.status.value : true;
      const matchStart = filters.startDate ? new Date(emp.date) >= filters.startDate : true;
      const matchEnd = filters.endDate ? new Date(emp.date) <= filters.endDate : true;
      return matchName && matchStatus && matchStart && matchEnd;
    });

    const grouped = statusColumns.reduce((acc, status) => {
      acc[status] = filtered.filter((task) => task.status === status);
      return acc;
    }, {});
    setTasksByStatus(grouped);
  }, [filters]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // If dropped in the same place, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Copy current state to update
    const sourceTasks = Array.from(tasksByStatus[source.droppableId]);
    const destTasks = Array.from(tasksByStatus[destination.droppableId]);

    // Remove dragged task from source
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Update status if moved to different column
    movedTask.status = destination.droppableId;

    // Insert task into destination
    destTasks.splice(destination.index, 0, movedTask);

    // Update state with new columns
    setTasksByStatus({
      ...tasksByStatus,
      [source.droppableId]: sourceTasks,
      [destination.droppableId]: destTasks,
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company || "Company Name"}</h2>
        <ProjectSidebar />
      </aside>

      <div className="flex flex-col flex-1">
        <Header title="Figma-like Draggable Task Dashboard" />
        <main className="flex-1 p-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search employee..."
              value={filters.employee}
              onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
              className="p-2 border rounded"
            />
            <Select
              options={statusOptions}
              placeholder="Filter by status"
              isClearable
              value={filters.status}
              onChange={(option) => setFilters({ ...filters, status: option })}
            />
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              placeholderText="Start date"
              className="p-2 border rounded w-full"
            />
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              placeholderText="End date"
              className="p-2 border rounded w-full"
            />
          </div>

          {/* Draggable Kanban Columns */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[70vh] overflow-y-auto">
              {statusColumns.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white rounded shadow p-3 flex flex-col max-h-[70vh] overflow-auto
                        ${snapshot.isDraggingOver ? "bg-indigo-100" : ""}
                      `}
                    >
                      <h3
                        className={`text-md font-semibold mb-2 ${getStatusColor(status)} text-white px-2 py-1 rounded`}
                      >
                        {status}
                      </h3>

                      {(tasksByStatus[status] || []).map((task, index) => (
                        <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-lg shadow-lg mb-3 cursor-move
                              ${snapshot.isDragging ? "opacity-80" : "opacity-100"}
                              `}
                            >
                              <h4 className="font-semibold">{task.task}</h4>
                              <p className="text-sm">Assigned to: {task.name}</p>
                              <p className="text-xs">{task.date}</p>
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
        </main>
      </div>
    </div>
  );
};

export default EmployeeTaskTracker;
