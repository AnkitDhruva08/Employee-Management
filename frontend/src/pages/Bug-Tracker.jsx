import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import CkEditor from "../components/editor/CkEditor";
import FileUpload from "../components/File/FileUpload";
import CompanyLogo from "../components/CompanyLogo";
import { validateFileTypes } from "../utils/validation";
import {
  fetchDashboard,
  fetchProjectsData,
  fetchEmployees,
  fetchBugsReports,
  fetchProjectSidebar,
  fetchBugDetails,
  fetchDashboardLink,
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
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [selectedBug, setSelectedBug] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [fileError, setFileError] = useState("");

  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    status: "",
    priority: "",
    assignedTo: [],
    description: "",
    resolutionComments: "",
    bugAttachment: null,
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const links = await fetchDashboardLink(token);
      setQuickLinks(links.data || links);

      const dashboard = await fetchDashboard(token);
      setDashboardData(dashboard);

      const projects = await fetchProjectsData(token);
      setProjects(projects.results);

      const employeesData = await fetchEmployees(token);
      setEmployees(
        Array.isArray(employeesData) ? employeesData : [employeesData]
      );

      if (id) {
        const bugDetails = await fetchBugDetails(token, id);
        setBugs([bugDetails]);
      } else {
        const bugsData = await fetchBugsReports(
          token,
          statusFilter?.value || "",
          priorityFilter?.value || "",
          selectedProjectId || ""
        );

        setBugs(bugsData);
      }
    } catch (err) {
      console.error("Error:", err);
      localStorage.removeItem("token");
      sessionStorage.clear();
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, statusFilter, priorityFilter, selectedProjectId, id]);

  // handle file changes
  const handleFileChange = (files) => {
    const { isValid, validFiles, error } = validateFileTypes(files);

    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: error,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      bugAttachment: validFiles[0] || null,
    }));
  };

  // Function for adding new bugs
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

    const data = new FormData();
    data.append("title", formData.title);
    data.append("project", formData.projectId);
    data.append("status", formData.status);
    data.append("priority", formData.priority);
    data.append("description", formData.description);
    // Add resolution comments
    data.append("resolution_comments", formData.resolutionComments);

    // Handle assigned users (as a list)
    formData.assignedTo.forEach((assignee) => {
      data.append("assigned_to", assignee.value);
    });

    // Attach file if it exists
    if (formData.bugAttachment instanceof File) {
      data.append("bug_attachment", formData.bugAttachment);
    }

    try {
      const response = await fetch("http://localhost:8000/api/bugs-reportes/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error", errorData.detail || "Failed to add bug", "error");
        return;
      }

      const responseData = await response.json();

      const newBug = {
        id: responseData.id || bugs.length + 100,
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        description: formData.description,
        resolution_comments: formData.resolutionComments,
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

  // Function for updating bugs
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

    // Prepare FormData for multipart request
    const data = new FormData();
    data.append("title", formData.title);
    data.append("project", formData.projectId);
    data.append("status", formData.status);
    data.append("priority", formData.priority);
    data.append("description", formData.description);
    data.append("resolution_comments", formData.resolutionComments);

    // Handle assigned_to
    if (formData.assignedTo && Array.isArray(formData.assignedTo)) {
      formData.assignedTo.forEach((item) => {
        if (item?.value) {
          data.append("assigned_to", item.value);
        }
      });
    }

    // Handle file upload
    if (formData.bugAttachment instanceof File) {
      data.append("bug_attachment", formData.bugAttachment);
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/bugs-reportes/${selectedBug.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire(
          "Error",
          errorData.message || "Failed to update bug",
          "error"
        );
        return;
      }

      const updatedData = await response.json();

      const updatedBug = {
        ...selectedBug,
        ...updatedData,
        project_name:
          projects.find((p) => p.id === formData.projectId)?.project_name || "",
      };

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
      resolutionComments: "",
    });
    setShowModal(false);
    setSelectedBug(null);
  };

  // Function for deleting bug reports
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
          const response = await fetch(
            `http://localhost:8000/api/bugs-reportes/${id}/`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            Swal.fire(
              "Error",
              errorData.message || "Failed to delete bug",
              "error"
            );
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
      { key: "id", label: "ID" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "assigned_to_name", label: "Assigned To" },
      { key: "project_name", label: "Project" },
      { key: "created", label: "Created Date" },
      { key: "description", label: "Description" },
      { key: "resolution_comments", label: "Resolution Comments" },
    ];

    // Step 1: Ensure only relevant fields are exported
    const cleanedData = data.map((row) =>
      Object.fromEntries(headers.map(({ key }) => [key, row[key] || ""]))
    );

    // Step 2: Create worksheet (starts at A1, includes raw headers)
    const worksheet = XLSX.utils.json_to_sheet(cleanedData);

    // Step 3: Replace raw headers with styled labels
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;

      worksheet[cellAddress].v = header.label; // Set header label
      worksheet[cellAddress].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFFFF" } },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        fill: { patternType: "solid", fgColor: { rgb: "FF2F5496" } },
        border: {
          top: { style: "medium", color: { rgb: "FF000000" } },
          bottom: { style: "medium", color: { rgb: "FF000000" } },
          left: { style: "medium", color: { rgb: "FF000000" } },
          right: { style: "medium", color: { rgb: "FF000000" } },
        },
      };
    });

    const statusColorsExport = {
      Done: "FF92D050", // Green
      "In Progress": "FFFFFF00", // Yellow
      Open: "FFFF0000", // Red
      Blocked: "FF0000FF", // Blue
      "Not a Defect": "FFD9D9D9", // Light Grey
      Closed: "FFFFC000", // Orange
      "Re-Open": "FFFF99CC", // Pink
    };

    // Step 4: Style each cell row by row
    cleanedData.forEach((row, rowIndex) => {
      const excelRow = rowIndex + 1; // +1 because header is row 0
      const rowFillColor =
        rowIndex % 2 === 0 ? { rgb: "FFF2F2F2" } : { rgb: "FFFFFFFF" };

      headers.forEach((header, colIdx) => {
        const value = row[header.key];
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: excelRow });

        worksheet[cellAddress] = worksheet[cellAddress] || { t: "s", v: value };

        worksheet[cellAddress].s = {
          alignment: {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
          },
          font: { name: "Calibri", sz: 11, color: { rgb: "FF333333" } },
          border: {
            top: { style: "thin", color: { rgb: "FFDDDDDD" } },
            bottom: { style: "thin", color: { rgb: "FFDDDDDD" } },
            left: { style: "thin", color: { rgb: "FFDDDDDD" } },
            right: { style: "thin", color: { rgb: "FFDDDDDD" } },
          },
          fill: { patternType: "solid", fgColor: rowFillColor },
        };

        // Status-specific styling
        if (header.key === "status") {
          worksheet[cellAddress].s.fill.fgColor = {
            rgb: statusColorsExport[value] || "FFFFFFFF",
          };
          worksheet[cellAddress].s.font.bold = true;
          worksheet[cellAddress].s.font.color = { rgb: "FF000000" };
          worksheet[cellAddress].s.alignment.horizontal = "center";
        }

        // Center-align these columns
        if (["id", "priority", "created"].includes(header.key)) {
          worksheet[cellAddress].s.alignment.horizontal = "center";
        }

        // Force wrap and alignment for text-heavy fields
        if (["description", "resolution_comments"].includes(header.key)) {
          worksheet[cellAddress].s.alignment.horizontal = "left";
          worksheet[cellAddress].s.alignment.vertical = "top";
        }
      });
    });

    // Step 5: Adjust column widths
    worksheet["!cols"] = headers.map(({ key, label }) => {
      let maxLength = label.length;

      if (key === "id") maxLength = Math.max(maxLength, 8);
      if (key === "title") maxLength = Math.max(maxLength, 30);
      if (key === "status") maxLength = Math.max(maxLength, 15);
      if (key === "priority") maxLength = Math.max(maxLength, 10);
      if (key === "assigned_to_name") maxLength = Math.max(maxLength, 25);
      if (key === "project_name") maxLength = Math.max(maxLength, 25);
      if (key === "created") maxLength = Math.max(maxLength, 18);
      if (key === "description") maxLength = Math.max(maxLength, 50);
      if (key === "resolution_comments") maxLength = Math.max(maxLength, 40);

      for (const row of cleanedData) {
        const val = row[key];
        if (val) {
          const len = String(val).length > 200 ? 200 : String(val).length;
          if (len > maxLength) maxLength = len;
        }
      }

      return { wch: maxLength + 7 };
    });

    // Step 6: Export
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
    console.log("bug ==<<>", bug);
    if ((mode === "edit" || mode === "view") && bug) {
      setFormData({
        title: bug.title,
        projectId: bug.project,
        status: bug.status,
        priority: bug.priority,
        description: bug.description,
        resolutionComments: bug.resolution_comments || "",
        bugAttachment: bug.bug_attachment || null,
        assignedTo: bug.assigned_to
          ? bug.assigned_to
              .map((id) => {
                const emp = (
                  Array.isArray(employees) ? employees : [employees]
                ).find((e) => e.id === id);
                if (roleId === 3) {
                  return emp
                    ? {
                        label: emp.first_name + " " + emp.last_name,
                        value: emp.id,
                      }
                    : null;
                } else {
                  return emp ? { label: emp.username, value: emp.id } : null;
                }
              })
              .filter(Boolean)
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
        {dashboardData && <CompanyLogo logoPath={dashboardData.company_logo} />}
        <Sidebar quickLinks={quickLinks} />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title="Bug Tracker" />

        <main className="flex-1  p-6 space-y-6">
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
              options={projects.map((p) => ({
                value: p.id,
                label: p.project_name,
              }))}
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

          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full border-collapse table-fixed text-sm">
                {/* Table Header */}
                <thead className="bg-blue-200 sticky top-0">
                  <tr>
                    <th className="p-3 border border-gray-300 w-16">Index</th>
                    <th className="p-3 border border-gray-300">Title</th>
                    <th className="p-3 border border-gray-300">Status</th>
                    <th className="p-3 border border-gray-300">Priority</th>
                    <th className="p-3 border border-gray-300">Assigned To</th>
                    <th className="p-3 border border-gray-300">Project</th>
                    <th className="p-3 border border-gray-300">Created</th>
                    <th className="p-3 border border-gray-300">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {bugs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center p-4 text-gray-500">
                        No bug reports found.
                      </td>
                    </tr>
                  ) : (
                    bugs.map((bug, index) => (
                      <tr key={bug.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border border-gray-300 w-16">
                          #{index + 1}
                        </td>
                        <td className="p-3 border border-gray-300 font-medium text-gray-800">
                          {bug.title}
                        </td>
                        <td className="p-3 border border-gray-300">
                          <span
                            className={`px-2 py-1 text-white text-xs font-semibold whitespace-nowrap ${
                              statusColors[bug.status]
                            }`}
                          >
                            {bug.status}
                          </span>
                        </td>
                        <td className="p-3 border border-gray-300">
                          <span
                            className={`px-2 py-1 text-white text-xs font-semibold ${
                              priorityColors[bug.priority]
                            }`}
                          >
                            {bug.priority}
                          </span>
                        </td>
                        <td className="p-3 border border-gray-300">
                          {bug.assigned_to_name || "Unassigned"}
                        </td>
                        <td className="p-3 border border-gray-300">
                          {bug.project_name}
                        </td>
                        <td className="p-3 border border-gray-300">
                          {new Date(bug.created).toLocaleDateString()}
                        </td>
                        <td className="p-3 border border-gray-300">
                          <div className="flex items-center space-x-2">
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Add/Edit/View Bug */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
                onClick={resetForm}
                aria-label="Close modal"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === "add"
                  ? "Add Bug"
                  : modalMode === "edit"
                  ? "Edit Bug"
                  : "View Bug"}
              </h2>

              {/* Helpers */}
              {(() => {
                const isReadOnly = modalMode === "view" ;

                return (
                  <>
                    {/* Title */}
                    <Input
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      readOnly={isReadOnly}
                    />

                    {/* Project */}
                    <div>
                      <label className="block font-medium mb-1">
                        Project *
                      </label>
                      <Select
                        options={projects.map((p) => ({
                          value: p.id,
                          label: p.project_name,
                        }))}
                        value={
                          projects
                            .map((p) => ({
                              value: p.id,
                              label: p.project_name,
                            }))
                            .find((opt) => opt.value === formData.projectId) ||
                          null
                        }
                        onChange={(opt) =>
                          setFormData({
                            ...formData,
                            projectId: opt?.value || "",
                          })
                        }
                        isDisabled={isReadOnly}
                        placeholder="Select Project"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-medium mb-1">Status *</label>
                      <Select
                        options={statusOptions}
                        value={
                          statusOptions.find(
                            (opt) => opt.value === formData.status
                          ) || null
                        }
                        onChange={(opt) =>
                          setFormData({ ...formData, status: opt?.value || "" })
                        }
                        isDisabled={modalMode === "view"} 
                        placeholder="Select Status"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block font-medium mb-1">
                        Priority *
                      </label>
                      <Select
                        options={priorityOptions}
                        value={
                          priorityOptions.find(
                            (opt) => opt.value === formData.priority
                          ) || null
                        }
                        onChange={(opt) =>
                          setFormData({
                            ...formData,
                            priority: opt?.value || "",
                          })
                        }
                        isDisabled={isReadOnly}
                        placeholder="Select Priority"
                      />
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label className="block font-medium mb-1">
                        Assigned To
                      </label>
                      <Select
                        options={
                          Array.isArray(employees)
                            ? employees.map((emp) => ({
                                value: emp.id,
                                label: emp.username,
                              }))
                            : []
                        }
                        isMulti
                        value={formData.assignedTo}
                        onChange={(selected) =>
                          setFormData({
                            ...formData,
                            assignedTo: selected || [],
                          })
                        }
                        isDisabled={isReadOnly}
                        placeholder="Select Employees"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block font-medium mb-1">
                        Description
                      </label>
                      <CkEditor
                        value={formData.description}
                        onChange={(data) =>
                          setFormData({ ...formData, description: data })
                        }
                        readOnly={isReadOnly}
                      />
                    </div>

                    {/* Resolution Comments */}
                    <div>
                      <label className="block font-medium mb-1">
                        Resolution Comments
                      </label>
                      <CkEditor
                        value={formData.resolutionComments}
                        onChange={(data) =>
                          setFormData({ ...formData, resolutionComments: data })
                        }
                        readOnly={modalMode === "view"}
                      />
                    </div>

                    {/* Attachment */}
                    <div>
                      <label className="block font-medium mb-1">
                        Attachment
                      </label>
                      <FileUpload
                        isView={modalMode === "view"}
                        isCombine={false}
                        initialFiles={
                          formData.bugAttachment ? [formData.bugAttachment] : []
                        }
                        onFilesSelected={handleFileChange}
                      />
                    </div>

                    {/* Submit Button */}
                    {modalMode !== "view" && (
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          onClick={resetForm}
                          className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                        >
                          Cancel
                        </button>

                        {/* Role 3 (Dev) can only update, not add */}
                        {(modalMode === "add" ) ||
                        modalMode === "edit" ? (
                          <button
                            onClick={
                              modalMode === "add"
                                ? handleAddBug
                                : handleUpdateBug
                            }
                            className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                          >
                            {modalMode === "add" ? "Add Bug" : "Update Bug"}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugTracker;
