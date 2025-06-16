import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import CompanyLogo from "../components/CompanyLogo";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchEmployees,
  fecthTasks, 
  loadTaskTags,
  generateTaskCards,
} from "../utils/api";
import Swal from "sweetalert2";
import Sidebar from "../components/sidebar/Sidebar";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

const tagColorMap = {
  "New": "bg-purple-100 text-purple-800",
  "Pending": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Blocked": "bg-red-100 text-red-800",
  "Testing": "bg-indigo-100 text-indigo-800",
  "Completed": "bg-green-100 text-green-800",
  "On Hold": "bg-gray-100 text-gray-800",
};

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#e34a4a", "#4a8ee3", "#e34a8e", "#8a4ae3"];
const BAR_COLORS = ["#4A90E2", "#50E3C2", "#F5A623", "#BD10E0"];

export default function TaskDashboard() {
  const [filterTagId, setFilterTagId] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [newTagColor, setNewTagColor] = useState("");
  const [taskTags, setTaskTags] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const dashboard = await fetchDashboard(token);
      setDashboardData(dashboard);

      const links = await fetchDashboardLink(token);
      setQuickLinks(links);

      const emp = await fetchEmployees(token);
      setEmployees(emp);

      const tagList = await loadTaskTags(token);
      console.log('tagList ==<<<>>', tagList)
      setTaskTags(tagList);

      // This part is crucial, ensure fecthTasks is called with the correct parameters
      const taskData = await fecthTasks(
        token,
        filterTagId,
        filterEmployeeId,
        filterStartDate,
        filterEndDate,
        filterMonth
      );
      const taskCards = await generateTaskCards(taskData, tagList, filterEmployeeId);
      setTasks(taskCards);
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
  }, [token, navigate, filterTagId, filterEmployeeId, filterStartDate, filterEndDate, filterMonth]);

  const taskTagData = useMemo(() => {
    const tagCounts = tasks.reduce((acc, task) => {
      task.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});

    return Object.keys(tagCounts).map((tag) => ({
      name: tag,
      value: tagCounts[tag],
    }));
  }, [tasks]);

  const tasksPerEmployeeData = useMemo(() => {
    const employeeCounts = tasks.reduce((acc, task) => {
      acc[task.employee] = (acc[task.employee] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(employeeCounts).map((employee) => ({
      name: employee,
      tasks: employeeCounts[employee],
    }));
  }, [tasks]);

  const monthlyEmployeeSummary = useMemo(() => {
    // Assuming filterEmployeeId is set to an employee's ID and filterMonth is set
    if (filterEmployeeId && filterMonth) {
      // Find the employee's username from the employees list for display
      const selectedEmployee = employees.find(emp => emp.id === parseInt(filterEmployeeId));
      const employeeName = selectedEmployee ? selectedEmployee.username : 'Unknown Employee';

      const total = tasks.length;
      const completed = tasks.filter(task => task.tags.includes("Completed")).length;
      const inProgress = tasks.filter(task => task.tags.includes("In Progress")).length;
      const pending = tasks.filter(task => task.tags.includes("Pending")).length;
      const blocked = tasks.filter(task => task.tags.includes("Blocked")).length;
      const testing = tasks.filter(task => task.tags.includes("Testing")).length;
      const onHold = tasks.filter(task => task.tags.includes("On Hold")).length;

      return { total, completed, inProgress, pending, blocked, testing, onHold, employeeName };
    }
    return null;
  }, [tasks, filterEmployeeId, filterMonth, employees]);

  const clearFilters = () => {
    setFilterTagId("");
    setFilterEmployeeId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterMonth("");
  };

  const handleAddTag = async () => {
    const trimmedTag = newTagInput.trim();

    if (!trimmedTag) {
      Swal.fire({
        icon: "warning",
        title: "Empty Stage Name",
        text: "Please enter a stage name before submitting.",
      });
      return;
    }

    if (!newTagColor) {
      Swal.fire({
        icon: "warning",
        title: "Color Missing",
        text: "Please select a color before submitting.",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/task-tags/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedTag,
          color: newTagColor,
          icon: trimmedTag,
        }),
      });

      if (response.ok) {
        setNewTagInput("");
        setNewTagColor("");
        fetchData();
        Swal.fire({
          icon: "success",
          title: "Stage Added",
          text: `"${trimmedTag}" was added successfully.`,
          showConfirmButton: false,
          timer: 1500,
        });
      } else if (response.status === 400) {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: data.message || "Something went wrong. Please check your input.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An unexpected error occurred.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Unable to reach the server.",
      });
    }
  };

  const handleDeleteTag = async (tagId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the tag.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:8000/api/task-tags/${tagId}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchData();
          Swal.fire('Deleted!', 'The tag has been removed.', 'success');
        } else {
          Swal.fire('Error!', 'Failed to delete the tag.', 'error');
        }
      } catch (error) {
        console.error("Error deleting tag:", error);
        Swal.fire('Error!', 'Something went wrong.', 'error');
      }
    }
  };

  const monthOptions = useMemo(() => {
    const months = [
      { value: "", label: "All Months" },
      { value: "01", label: "January" },
      { value: "02", label: "February" },
      { value: "03", label: "March" },
      { value: "04", label: "April" },
      { value: "05", label: "May" },
      { value: "06", label: "June" },
      { value: "07", label: "July" },
      { value: "08", label: "August" },
      { value: "09", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
    ];
    return months;
  }, []);


  console.log('taskTags ankit ==<>', taskTags)

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && <CompanyLogo logoPath={dashboardData.company_logo} />}
        <Sidebar quickLinks={quickLinks} />
      </aside>
      <div className="flex flex-col flex-1 bg-gray-500">
        <Header title="Employee Task Dashboard" />
        <main className="p-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24"></svg>
              Manage Task Stages (Admin)
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Add new stage (e.g., 'Review')"
                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag();
                }}
              />

              <div className="relative w-52">
                <select
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full p-3 appearance-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm pr-10"
                >
                  <option value="">Select Color</option>
                  <option value="bg-purple-100 text-purple-800">Purple</option>
                  <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                  <option value="bg-blue-100 text-blue-800">Blue</option>
                  <option value="bg-red-100 text-red-800">Red</option>
                  <option value="bg-indigo-100 text-indigo-800">Indigo</option>
                  <option value="bg-green-100 text-green-800">Green</option>
                  <option value="bg-gray-100 text-gray-800">Gray</option>
                </select>
                {newTagColor && (
                  <div
                    className={`absolute right-3 top-3 w-4 h-4 rounded-full border ${newTagColor.split(" ")[0]
                      }`}
                  ></div>
                )}
              </div>

              <button
                onClick={handleAddTag}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition transform hover:scale-105"
              >
                Add Stage
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {taskTags.map(({ id, name, color, iconPath }) => (
                <span
                  key={id}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 ${color} shadow-sm hover:shadow-lg transition-transform duration-200 hover:scale-105`}
                >
                  <span className="w-4 h-4">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      dangerouslySetInnerHTML={{ __html: iconPath }}
                    ></svg>
                  </span>
                  <span className="font-medium">{name}</span>
                  <button
                    onClick={() => handleDeleteTag(id)}
                    className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                    title="Delete tag"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          ---

          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-indigo-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Filter Tasks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label
                  htmlFor="tagFilter"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Stage/Tag
                </label>
                <select
                  id="tagFilter"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
                  value={filterTagId}
                  onChange={(e) => setFilterTagId(e.target.value)}
                >
                  <option value="">All Stages/Tags</option>
                  {taskTags.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="employee"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Employee
                </label>
                <select
                  id="employee"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map(({ id, username }) => (
                    <option key={id} value={id}>
                      {username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="startDate"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="endDate"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="monthFilter"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Month
                </label>
                <select
                  id="monthFilter"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-center mt-4">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition transform hover:scale-105"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>


          {/* --- Charts Section --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Task Tag Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>{" "}
                Task Stage Distribution
              </h2>
              {taskTagData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskTagData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {taskTagData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">
                  No data for chart with current filters.
                </p>
              )}
            </div>

            {/* Tasks Per Employee Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>{" "}
                Tasks Per Employee
              </h2>
              {tasksPerEmployeeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={tasksPerEmployeeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      height={50}
                      style={{ fontSize: "0.8rem" }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="tasks"
                      fill={BAR_COLORS[0]}
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">
                  No data for chart with current filters.
                </p>
              )}
            </div>
          </div>

          {/* --- month view --- */}
          {monthlyEmployeeSummary && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-2xl shadow-xl mb-8 text-white flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
              <div className="flex items-center gap-4">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold">
                    {monthlyEmployeeSummary.employeeName}'s Activities in{" "}
                    {monthOptions.find((m) => m.value === filterMonth)?.label}
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Overview for the selected month
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full sm:w-auto">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                  <p className="text-lg font-semibold">
                    {monthlyEmployeeSummary.total}
                  </p>
                  <p className="text-xs text-indigo-100">Total Tasks</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                  <p className="text-lg font-semibold">
                    {monthlyEmployeeSummary.completed}
                  </p>
                  <p className="text-xs text-indigo-100">Completed</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                  <p className="text-lg font-semibold">
                    {monthlyEmployeeSummary.inProgress}
                  </p>
                  <p className="text-xs text-indigo-100">In Progress</p>
                </div>
                {monthlyEmployeeSummary.blocked > 0 && (
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                    <p className="text-lg font-semibold">
                      {monthlyEmployeeSummary.blocked}
                    </p>
                    <p className="text-xs text-indigo-100">Blocked</p>
                  </div>
                )}
                {monthlyEmployeeSummary.testing > 0 && (
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                    <p className="text-lg font-semibold">
                      {monthlyEmployeeSummary.testing}
                    </p>
                    <p className="text-xs text-indigo-100">Testing</p>
                  </div>
                )}
                {monthlyEmployeeSummary.onHold > 0 && (
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                    <p className="text-lg font-semibold">
                      {monthlyEmployeeSummary.onHold}
                    </p>
                    <p className="text-xs text-indigo-100">On Hold</p>
                  </div>
                )}
                <div className="p-3 bg-white bg-opacity-20 rounded-lg shadow-inner">
                  <p className="text-lg font-semibold">
                    {monthlyEmployeeSummary.pending}
                  </p>
                  <p className="text-xs text-indigo-100">Pending</p>
                </div>
              </div>
            </div>
          )}

          {/* --- Task List Section --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={`${task.id}-${task.employee}-${task.title}`}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={task.avatar || "https://i.pravatar.cc/150?img=1"}
                      alt={task.employee || "Employee Avatar"}
                      className="w-14 h-14 rounded-full border-4 border-indigo-200 ring-2 ring-indigo-300"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {task.employee || "Unknown Employee"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {task.date || "No Date"}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-indigo-700 mb-2 leading-tight">
                    {task.title || "Untitled Task"}
                  </h4>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {task.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(task.tags) && task.tags.length > 0 ? (
                      task.tags.map((tag) => (
                        <div
                          key={tag}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${tagColorMap[tag] || "bg-gray-200 text-gray-800"
                            } shadow-inner`}
                        >
                          {tag}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No tags</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="lg:col-span-4 text-center p-10 bg-white rounded-2xl shadow-xl text-gray-600 text-lg">
                No tasks found matching your filters. Try clearing filters.
              </div>
            )}
          </div>
        </main>
        <div className="max-w-7xl mx-auto"></div>
      </div>
    </div>
  );
}