// BugTracker.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchProjects,
  fetchEmployees,
  fetchBugsReports,
} from "../utils/api";
import Swal from "sweetalert2";
import Select from "react-select";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [modalMode, setModalMode] = useState(null); 
  const [selectedBug, setSelectedBug] = useState(null);
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [links, dashboard, proj, emps, bugsData] = await Promise.all([
        fetchDashboardLink(token),
        fetchDashboard(token),
        fetchProjects(token),
        fetchEmployees(token),
        fetchBugsReports(token),
      ]);
      setDashboardData(dashboard);
      setProjects(proj);
      setEmployees(emps);
      console.log("bugsData ===<<<>>", bugsData);
      setBugs(bugsData);
    } catch (err) {
      console.error("Error:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  useEffect(() => {
    if (modalMode === 'edit' && selectedBug) {
      setFormData({
        title: selectedBug.title,
        projectId: selectedBug.project,
        status: selectedBug.status,
        priority: selectedBug.priority,
        assignedTo: selectedBug.assigned_to_name
          ? selectedBug.assigned_to_name.split(', ').map(name => {
              const emp = employees.find(e => e.username === name);
              return emp ? { value: emp.id, label: emp.username } : null;
            }).filter(Boolean)
          : [],
      });
    }
  }, [modalMode, selectedBug, employees]);

  const handleAddBug = (e) => {
    e.preventDefault();
    const newBug = {
      id: bugs.length + 100,
      title: formData.title,
      status: formData.status,
      priority: formData.priority,
      assigned_to_name: formData.assignedTo.map((a) => a.label).join(", "),
      created: new Date().toISOString().split("T")[0],
      project_name:
        projects.find((p) => p.id === formData.projectId)?.project_name || "",
      project: formData.projectId,
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

  const handleExport = (data) => {
    const workbook = XLSX.utils.book_new();

    // Convert JSON to sheet, include header row
    const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A2" });

    const headers = [
      { key: "id", label: "ID" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "created", label: "Created Date" },
      { key: "assigned_to_name", label: "Assigned To" },
      { key: "project_name", label: "Project" },
      { key: "company", label: "Company" },
    ];

    // Manually set header row at A1
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      worksheet[cellAddress] = {
        t: "s",
        v: header.label,
        s: {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
        },
      };
    });

    // Prepare a map from key to col index
    const keyToCol = {};
    headers.forEach((h, i) => {
      keyToCol[h.key] = i;
    });

    // Style status column cells with colors
    const statusColors = {
      Done: "FF92D050",
      "In Progress": "FFFFFF00",
      Open: "FFFF0000",
      Blocked: "FF0000FF",
      High: "FFFF0000",
    };

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 1 + 1; // +1 for zero-based to 1-based, +1 for header row
      const statusValue = data[i].status;
      const colIndex = keyToCol["status"];
      if (colIndex === undefined) continue;

      const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowNumber });
      if (!worksheet[cellAddress]) continue;

      // Apply fill color for status
      const fillColor = statusColors[statusValue];
      if (fillColor) {
        worksheet[cellAddress].s = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: fillColor },
          },
        };
      }
    }

    // Calculate max width for each column for auto width
    const colWidths = headers.map(({ key }) => {
      // Start with header length
      let maxLength = headers.find((h) => h.key === key).label.length;

      // Compare all rows
      for (const row of data) {
        const value = row[key];
        if (value) {
          const len = String(value).length;
          if (len > maxLength) maxLength = len;
        }
      }

      // Add some padding to the length
      return { wch: maxLength + 2 };
    });

    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `bugs_reports.xlsx`);
  };

  const filteredBugs = bugs.filter(
    (bug) => !selectedProjectId || bug.project === selectedProjectId
  );

  const totalPages = Math.ceil(filteredBugs.length / itemsPerPage);
  const currentBugs = filteredBugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusCounts = bugs.reduce((acc, bug) => {
    acc[bug.status] = (acc[bug.status] || 0) + 1;
    return acc;
  }, {});




  const openModal = (mode, bug) => {
    setModalMode(mode);
    setSelectedBug(bug);
    setShowModal(true);
  };




  const handleUpdateBug = (e) => {
    e.preventDefault();
  
    setBugs((prev) =>
      prev.map((bug) =>
        bug.id === selectedBug.id
          ? {
              ...bug,
              title: formData.title,
              status: formData.status,
              priority: formData.priority,
              assigned_to_name: formData.assignedTo.map((a) => a.label).join(", "),
              project_name:
                projects.find((p) => p.id === formData.projectId)?.project_name || "",
              project: formData.projectId,
            }
          : bug
      )
    );
  
    setShowModal(false);
    setModalMode(null);
    setSelectedBug(null);
    setFormData({
      title: "",
      projectId: "",
      status: "",
      priority: "",
      assignedTo: [],
    });
  };
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setBugs((prev) => prev.filter((bug) => bug.id !== id));
        Swal.fire('Deleted!', 'Bug has been deleted.', 'success');
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">{dashboardData?.company}</h2>
        <ProjectSidebar />
      </aside>

      <div className="flex flex-col flex-1">
        <Header title="Bugs & Testing" />
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-700">
              Bug Dashboard
            </h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
              >
                Add Bug
              </button>
              <button
                onClick={() => handleExport(bugs)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-semibold"
              >
                Download Excel
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className={`rounded-lg text-white p-4 font-semibold ${statusColors[status]}`}
              >
                {status}: {count}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="w-full md:w-1/3">
            <label className="block font-semibold mb-1">
              Filter by Project
            </label>
            <Select
              options={projects.map((p) => ({
                value: p.id,
                label: p.project_name,
              }))}
              onChange={(option) => {
                setSelectedProjectId(option?.value);
                setCurrentPage(1);
              }}
              isClearable
              placeholder="Select a project"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto shadow rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 bg-gray-100">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBugs.map((bug) => (
                  <tr key={bug.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">#{bug.id}</td>
                    <td className="p-3">{bug.title}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-white text-xs font-semibold rounded-full ${
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
                    <td className="p-3 space-x-2">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => openModal('view', bug)}
                        >
                          View
                        </button>
                        <button
                          className="text-green-600 hover:underline"
                          onClick={() => openModal('edit', bug)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => handleDelete(bug.id)}
                        >
                          Delete
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
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
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
              />
              <Select
                placeholder="Select Project"
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.project_name,
                }))}
                onChange={(option) =>
                  setFormData({ ...formData, projectId: option?.value })
                }
              />
              <Select
                placeholder="Select Status"
                options={statusOptions}
                onChange={(option) =>
                  setFormData({ ...formData, status: option?.value })
                }
              />
              <Select
                placeholder="Select Priority"
                options={priorityOptions}
                onChange={(option) =>
                  setFormData({ ...formData, priority: option?.value })
                }
              />
              <Select
                isMulti
                placeholder="Assign to"
                options={employees.map((e) => ({
                  value: e.id,
                  label: e.username,
                }))}
                onChange={(options) =>
                  setFormData({ ...formData, assignedTo: options })
                }
              />
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



{showModal && (
  <>
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowModal(false)} />
    <div className="fixed z-50 top-1/2 left-1/2 w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-blue-700">
        {modalMode === 'view' && 'View Bug'}
        {modalMode === 'edit' && 'Edit Bug'}
        {modalMode === null && 'Add New Bug'}
      </h3>

      {modalMode === 'view' && selectedBug && (
        <div className="space-y-2 text-gray-700">
          <p><strong>Title:</strong> {selectedBug.title}</p>
          <p><strong>Status:</strong> {selectedBug.status}</p>
          <p><strong>Priority:</strong> {selectedBug.priority}</p>
          <p><strong>Assigned To:</strong> {selectedBug.assigned_to_name}</p>
          <p><strong>Project:</strong> {selectedBug.project_name}</p>
          <p><strong>Created:</strong> {selectedBug.created}</p>
          <div className="flex justify-end mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
          </div>
        </div>
      )}

      {modalMode === 'edit' && selectedBug && (
        <form onSubmit={handleUpdateBug} className="space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <Select
            placeholder="Select Project"
            options={projects.map((p) => ({ value: p.id, label: p.project_name }))}
            value={projects.find((p) => p.id === formData.projectId) ? { value: formData.projectId, label: projects.find((p) => p.id === formData.projectId).project_name } : null}
            onChange={(option) => setFormData({ ...formData, projectId: option?.value })}
          />
          <Select
            placeholder="Select Status"
            options={statusOptions}
            value={statusOptions.find((opt) => opt.value === formData.status)}
            onChange={(option) => setFormData({ ...formData, status: option?.value })}
          />
          <Select
            placeholder="Select Priority"
            options={priorityOptions}
            value={priorityOptions.find((opt) => opt.value === formData.priority)}
            onChange={(option) => setFormData({ ...formData, priority: option?.value })}
          />
          <Select
            isMulti
            placeholder="Assign to"
            options={employees.map((e) => ({ value: e.id, label: e.username }))}
            value={formData.assignedTo}
            onChange={(options) => setFormData({ ...formData, assignedTo: options })}
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Update</button>
          </div>
        </form>
      )}

   
    </div>
  </>
)}

    </div>
  );
};

export default BugTracker;
