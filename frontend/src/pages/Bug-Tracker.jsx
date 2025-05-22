import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import CkEditor from "../components/editor/CkEditor";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjects,
  fetchEmployees,
  fetchBugsReports,
  fetchProjectSidebar,
} from "../utils/api";
import Swal from "sweetalert2";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Eye, Pencil, Trash2 } from "lucide-react";

import Input from "../components/input/Input";

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

const BugTracker = () => {
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [modalMode, setModalMode] = useState('');
  const [selectedBug, setSelectedBug] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);


  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    status: "",
    priority: "",
    assignedTo: [],
    description: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const dashboardLinks = await fetchProjectSidebar(token);
      setQuickLinks(dashboardLinks);
  
      const dashboard = await fetchDashboard(token);
      setDashboardData(dashboard);
  
      const projects = await fetchProjects(token);
      setProjects(projects);
  
      const employees = await fetchEmployees(token);
      setEmployees(employees);
  
      const bugsData = await fetchBugsReports(token);
      setBugs(bugsData);
  
    } catch (err) {
      console.error("Error:", err);
      navigate("/login");
    }
  };
  


  

  useEffect(() => {
    fetchData();
  }, []);

  // Filter bugs based on filters
  const filteredBugs = bugs.filter((bug) => {
    const byProject = !selectedProjectId || bug.project === selectedProjectId;
    const byStatus = !statusFilter || bug.status === statusFilter.value;
    const byPriority = !priorityFilter || bug.priority === priorityFilter.value;
    return byProject && byStatus && byPriority;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBugs.length / itemsPerPage);
  const currentBugs = filteredBugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredBugs, currentPage, totalPages]);


  //  function for add the new bugs
  const handleAddBug = async (e) => {
    e.preventDefault();
  
    // Simple validation
    if (
      !formData.title ||
      !formData.projectId ||
      !formData.status ||
      !formData.priority ||
      !formData.description
    ) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8000/api/bugs-reportes/", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error", errorData.message || "Failed to add bug", "error");
        return;
      }
  
      const responseData = await response.json();
  
      // If the API returns the created bug, use it. If not, construct it locally
      const newBug = {
        id: responseData.id || bugs.length + 100,
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        description: formData.description,
        assigned_to_name: formData.assignedTo.map((a) => a.label).join(", "),
        created: new Date().toISOString().split("T")[0],
        project_name:
          projects.find((p) => p.id === formData.projectId)?.project_name || "",
        project: formData.projectId,
      };
  
      setBugs((prev) => [...prev, newBug]);
      resetForm();
  
      Swal.fire("Success", "Bug added successfully!", "success");
    } catch (error) {
      console.error("Error adding bug:", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };
  
  // function for update the bugs 

  const handleUpdateBug = async (e) => {
    e.preventDefault();
  
    if (
      !formData.title ||
      !formData.projectId ||
      !formData.status ||
      !formData.priority ||
      !formData.description
    ) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/bugs-reportes/${selectedBug.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error", errorData.message || "Failed to update bug", "error");
        return;
      }
  
      const updatedBug = {
        ...selectedBug,
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        description: formData.description, 
        assigned_to: formData.assignedTo.map((a) => a.value),
        project_name:
          projects.find((p) => p.id === formData.projectId)?.project_name || "",
        project: formData.projectId,
      };
  
      // Update frontend list
      setBugs((prev) =>
        prev.map((bug) => (bug.id === selectedBug.id ? updatedBug : bug))
      );
  
      resetForm();
      Swal.fire("Success", "Bug updated successfully!", "success");
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };
  

  const resetForm = () => {
    setFormData({
      title: "",
      projectId: "",
      status: "",
      priority: "",
      assignedTo: [],
      description: "",
    });
    setShowModal(false);
    setSelectedBug(null);
  };

  // function for delete the bugs reports
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8000/api/bugs-reportes/${id}/`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            Swal.fire("Error", errorData.message || "Failed to delete bug", "error");
            return;
          }
  
          setBugs((prev) => prev.filter((bug) => bug.id !== id));
          Swal.fire("Deleted!", "Bug has been deleted.", "success");
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire("Error", "Something went wrong!", "error");
        }
      }
    });
  };
  

  // Export to Excel
  const exportToExcel = (data) => {
    const workbook = XLSX.utils.book_new();
  
    const headers = [
      { key: "id"},
      { key: "created" },
      { key: "Description"},
      { key: "steps_to_reproduce"},
      { key: "status" },
      { key: "priority"},
      { key: "company" },
    ];
  
    const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A2" });
  
    // Add headers with styling
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      worksheet[cellAddress] = {
        t: "s",
        v: header.label,
        s: {
          font: { bold: true, sz: 12, color: { rgb: "FF000000" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          fill: { patternType: "solid", fgColor: { rgb: "FFCCE5FF" } },
          border: {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } },
          },
        },
      };
    });
  
    const keyToCol = Object.fromEntries(headers.map((h, i) => [h.key, i]));
  
    const statusColors = {
      Done: "FF92D050",
      "In Progress": "FFFFFF00",
      Open: "FFFF0000",
      Blocked: "FF0000FF",
      "Not a Defect": "FFD9D9D9",
      Closed: "FFFFC000",
      "Re-Open": "FFFF99CC",
    };
  
    // Apply styles to cells
    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2; 
  
      headers.forEach((header, colIdx) => {
        const value = data[i][header.key];
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: rowNumber });
  
        if (!worksheet[cellAddress]) return;
  
        // Set default cell style
        worksheet[cellAddress].s = {
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          font: { name: "Calibri", sz: 11 },
          border: {
            top: { style: "thin", color: { rgb: "FFCCCCCC" } },
            bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
            left: { style: "thin", color: { rgb: "FFCCCCCC" } },
            right: { style: "thin", color: { rgb: "FFCCCCCC" } },
          },
          fill: {},
        };
  
        // Style status column with background color
        if (header.key === "status") {
          const fillColor = statusColors[value] || "FFFFFFFF";
          worksheet[cellAddress].s.fill = {
            patternType: "solid",
            fgColor: { rgb: fillColor },
          };
          worksheet[cellAddress].s.font.bold = true;
        }
      });
    }
  
    // Auto column width
    worksheet["!cols"] = headers.map(({ key }) => {
      let maxLength = key.length;
      for (const row of data) {
        const val = row[key];
        if (val) {
          const len = String(val).length;
          if (len > maxLength) maxLength = len;
        }
      }
      return { wch: maxLength + 3 };
    });
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Defect Tracker");
  
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
  
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    saveAs(blob, `Defect_Tracker_Report.xlsx`);
  };
  

  const statusCounts = bugs.reduce((acc, bug) => {
    acc[bug.status] = (acc[bug.status] || 0) + 1;
    return acc;
  }, {});

  const openModal = (mode, bug) => {
    setModalMode(mode);
    setSelectedBug(bug);  
    if ((mode === "edit" || mode === "view") && bug) {
      setFormData({
        title: bug.title,
        projectId: bug.project,
        status: bug.status,
        priority: bug.priority,
        description: bug.description,
        assignedTo: bug.assigned_to ? bug.assigned_to.map((id) => {
            const emp = employees.find((e) => e.id === id);
            return emp ? { label: emp.username, value: emp.id } : null;
          }).filter(Boolean)
        : [],
      });
    } else {
      resetForm();
    }
  
    setShowModal(true);
  };
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company}</h2>
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title="Bug Tracker" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">

            <button
              onClick={() => openModal("add", null)}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Bug
            </button>

            <button
                onClick={() => exportToExcel(bugs)}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded"
            >
              Export to Excel
            </button>
          </div>
          {/* Filters & Buttons */}
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <Select
              className="w-full lg:w-1/3"
              options={projects.map((p) => ({ value: p.id, label: p.project_name }))}
              onChange={(opt) => setSelectedProjectId(opt?.value)}
              isClearable
              placeholder="Filter by Project"
            />
            <Select
              className="w-full lg:w-1/4"
              options={statusOptions}
              onChange={setStatusFilter}
              isClearable
              placeholder="Filter by Status"
            />
            <Select
              className="w-full lg:w-1/4"
              options={priorityOptions}
              onChange={setPriorityFilter}
              isClearable
              placeholder="Filter by Priority"
            />
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className={`rounded-lg text-white p-4 font-semibold ${statusColors[status]}`}
              >
                {status}: {count}
              </div>
            ))}
          </div>

          {/* Bugs Table */}
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border border-gray-300">Index</th>
                <th className="p-3 border border-gray-300">Title</th>
                <th className="p-3 border border-gray-300">Status</th>
                <th className="p-3 border border-gray-300">Priority</th>
                <th className="p-3 border border-gray-300">Assigned To</th>
                <th className="p-3 border border-gray-300">Project</th>
                <th className="p-3 border border-gray-300">Created</th>
                <th className="p-3 border border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBugs.map((bug, index) => (
                <tr key={bug.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">#{index + 1}</td>
                  <td className="p-3 font-medium text-gray-800">{bug.title}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-white text-xs whitespace-nowrap font-semibold rounded-full ${
                        statusColors[bug.status]
                      }`}
                    >
                      {bug.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-white text-xs font-semibold rounded-full ${
                        priorityColors[bug.priority]
                      }`}
                    >
                      {bug.priority}
                    </span>
                  </td>
                  <td className="p-3">{bug.assigned_to_name}</td>
                  <td className="p-3">{bug.project_name}</td>
                  <td className="p-3">{bug.created}</td>
                  <td className="p-3 flex items-center space-x-2">
                    <button
                      onClick={() => openModal("view", bug)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => openModal("edit", bug)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(bug.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                </td>

                </tr>
              ))}
              {currentBugs.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center p-4">
                    No bugs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center space-x-2 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-3 py-1">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => resetForm()}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {modalMode === "add"
                ? "Add Bug"
                : modalMode === "edit"
                ? "Edit Bug"
                : "View Bug"}
            </h2>

            <form
              onSubmit={
                modalMode === "add" ? handleAddBug : modalMode === "edit" ? handleUpdateBug : (e) => e.preventDefault()
              }
            >
              <div className="mb-4">
                 <Input label="Title" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Project *</label>
                <Select
                    options={projects.map((p) => ({
                      value: p.id,
                      label: p.project_name,
                    }))}
                    value={
                      projects
                        .map((p) => ({ value: p.id, label: p.project_name }))
                        .find((opt) => opt.value === formData.projectId) || null
                    }
                    onChange={(opt) =>
                      setFormData({ ...formData, projectId: opt?.value || "" })
                    }
                    isDisabled={modalMode === "view"}
                    placeholder="Select Project"
                  />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Status *</label>
                <Select
                  options={statusOptions}
                  value={statusOptions.find((opt) => opt.value === formData.status) || null}
                  onChange={(opt) => setFormData({ ...formData, status: opt?.value || "" })}
                  isDisabled={modalMode === "view"}
                  placeholder="Select Status"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Priority *</label>
                <Select
                  options={priorityOptions}
                  value={priorityOptions.find((opt) => opt.value === formData.priority) || null}
                  onChange={(opt) => setFormData({ ...formData, priority: opt?.value || "" })}
                  isDisabled={modalMode === "view"}
                  placeholder="Select Priority"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Assigned To</label>
                <Select
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: emp.username,
                  }))}
                  isMulti
                  value={formData.assignedTo}
                  onChange={(selected) =>
                    setFormData({ ...formData, assignedTo: selected || [] })
                  }
                  isDisabled={modalMode === "view"}
                  placeholder="Select Employees"
                />
              </div>
              <div className="mb-4">
              <CkEditor
                  value={formData.description}
                  onChange={(data) => setFormData({ ...formData, description: data })}
                />
              </div>

              {modalMode !== "view" && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {modalMode === "add" ? "Add Bug" : "Update Bug"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugTracker;
