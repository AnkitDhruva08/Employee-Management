import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import Swal from "sweetalert2";
import CompanyLogo from "../components/CompanyLogo";
import FileUpload from "../components/File/FileUpload";

const LeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newLeave, setNewLeave] = useState({
    duration: "Single Day",
    leave_type: "PL",
    from_date: format(new Date(), "yyyy-MM-dd"),
    to_date: "",
    reason: "",
    attachment: null,
  });
  const [dateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const HeaderTitle = "Employee Leave Details";
  const employeesPerPage = 5;
  const roleId = parseInt(localStorage.getItem("role_id"));

  const handleAuthenticationError = (errMessage) => {
    Swal.fire({
      icon: "error",
      title: "Session Expired",
      text: errMessage || "Your session has expired. Please log in again.",
      confirmButtonText: "Login",
    }).then(() => {
      localStorage.removeItem("token");
      sessionStorage.clear();
      navigate("/login");
    });
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/leave-requests/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleAuthenticationError(
          "Failed to authenticate. Please log in again."
        );
        return;
      }

      const data = await res.json();

      if (data.is_complete === false) {
        Swal.fire({
          icon: "warning",
          title: "Profile Incomplete",
          text:
            data.message ||
            "Please complete your profile before accessing leave features.",
          footer: `Missing: ${data.missing_sections || "Required Sections"}`,
        }).then(() => {
          navigate("/dashboard");
        });
        return;
      }

      setLeaveRequests(data.data || []);
    } catch (error) {
      console.error("Failed to fetch leave requests:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while loading leave requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const links = await fetchDashboardLink(token);
        const dashboardInfo = await fetchDashboard(token);
        setQuickLinks(links);
        setDashboardData(dashboardInfo);
        await fetchLeaveRequests();
      } catch (err) {
        console.error("Failed to load initial data:", err);
        if (err.message.includes("Unauthorized")) {
          handleAuthenticationError();
        } else {
          setError("Failed to load dashboard or leave requests.");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load initial data.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      handleAuthenticationError("No authentication token found.");
      return;
    }
    fetchInitialData();
  }, [token, navigate]);

  const handleOpen = () => setOpen(!open);

  useEffect(() => {
    const { startDate, endDate } = dateRange[0];

    if (newLeave.duration === "Multiple days") {
      setNewLeave((prev) => ({
        ...prev,
        from_date: format(startDate, "yyyy-MM-dd"),
        to_date: format(endDate, "yyyy-MM-dd"),
      }));
    } else {
      setNewLeave((prev) => ({
        ...prev,
        to_date: "",
        from_date: format(new Date(), "yyyy-MM-dd"),
      }));
    }
  }, [newLeave.duration, dateRange]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setNewLeave((prev) => ({ ...prev, attachment: files[0] }));
    } else {
      setNewLeave((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredLeaveRequests = leaveRequests.filter((leave) => {
    const name =
      leave.username ||
      `${leave.employee?.first_name || ""} ${leave.employee?.last_name || ""}`;
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentLeaveRequests = filteredLeaveRequests.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const totalPages = Math.ceil(filteredLeaveRequests.length / employeesPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    Object.entries(newLeave).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });

    try {
      const res = await fetch("http://localhost:8000/api/leave-requests/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 401) {
        handleAuthenticationError(
          "Failed to authenticate. Please log in again."
        );
        return;
      }

      if (res.ok) {
        const newData = await res.json();
        setSuccess("Leave Applied Successfully");
        setLeaveRequests((prev) => [...prev, newData]);
        setOpen(false);
        setNewLeave({
          duration: "Single Day",
          leave_type: "PL",
          from_date: format(new Date(), "yyyy-MM-dd"),
          to_date: "",
          reason: "",
          attachment: null,
        });
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Leave applied successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchLeaveRequests();
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to apply leave.");
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: errorData.message || "Failed to apply leave.",
        });
      }
    } catch (err) {
      setError("Failed to connect to server.");
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to connect to server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (leave) => {
    const statusMap = {
      "Admin Approved": "Approved",
      "HR Approved": "HR Approved",
      "Admin Rejected": "Rejected",
      "HR Rejected": "Rejected",
    };
    return statusMap[leave.status] || "Pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-500 text-white";
      case "Admin Approved":
        return "bg-blue-500 text-white";
      case "HR Approved":
        return "bg-indigo-500 text-white";
      case "Rejected":
        return "bg-red-500 text-white";
      case "Pending":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && <CompanyLogo logoPath={dashboardData.company_logo} />}
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
          <h2 className="text-xl font-semibold">
            Leave <span className="font-bold">Requests</span>
          </h2>

          <div className="flex gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by name or leave type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
            />
            <button
              onClick={handleOpen}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Apply for Leave
            </button>
          </div>
        </div>

        {open && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg">
              <h2 className="text-2xl font-semibold text-center mb-6">
                Apply for Leave
              </h2>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="leave_type"
                    className="block text-gray-700 mb-1"
                  >
                    Leave Type
                  </label>
                  <select
                    id="leave_type"
                    name="leave_type"
                    value={newLeave.leave_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PL">Personal Leave</option>
                    <option value="SL">Sick Leave</option>
                    <option value="CL">Casual Leave</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="block text-gray-700 mb-1"
                  >
                    Duration
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={newLeave.duration}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Half day">Half Day</option>
                    <option value="Single day">Single Day</option>
                    <option value="Multiple days">Multiple Days</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      name="from_date"
                      value={newLeave.from_date}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {newLeave.duration === "Multiple days" && (
                    <div className="flex-1">
                      <label className="block text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        name="to_date"
                        value={newLeave.to_date}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="reason" className="block text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={newLeave.reason}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="attachment"
                    className="block text-gray-700 mb-1"
                  >
                    Attachment
                  </label>
                  <input
                    type="file"
                    name="attachment"
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleOpen}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

<div className="p-6">
  <h2 className="text-2xl font-semibold mb-4">Leave Status</h2>
  {loading ? (
    <div className="text-center text-gray-500">Loading leave requests...</div>
  ) : (
    <table className="min-w-full table-auto border border-gray-300">
      <thead className="bg-blue-50">
        <tr>
          <th className="px-4 py-2 border">Leave Type</th>
          <th className="px-4 py-2 border">From Date</th>
          <th className="px-4 py-2 border">To Date</th>
          <th className="px-4 py-2 border">Duration</th>
          <th className="px-4 py-2 border">Reason</th>
          <th className="px-4 py-2 border">Attached Documents</th>
          <th className="px-4 py-2 border">Status</th>
        </tr>
      </thead>
      <tbody>
        {currentLeaveRequests.length > 0 ? (
          currentLeaveRequests
            .filter((leave) =>
              roleId === 3
                ? true
                : roleId === 2
                ? leave.employee__role_id === 2
                : leave.employee__role_id === 1
            )
            .map((leave, index) => {
              let leaveDocumentUrl = "";
              if (leave.leave_document) {
                leaveDocumentUrl = leave.leave_document.startsWith("media/")
                  ? `http://localhost:8000/${leave.leave_document}`
                  : `http://localhost:8000/media/${leave.leave_document}`;
              }

              return (
                <tr key={index} className="odd:bg-gray-50 even:bg-white">
                  <td className="px-4 py-2 border">{leave.leave_type}</td>
                  <td className="px-4 py-2 border">{leave.from_date}</td>
                  <td className="px-4 py-2 border">{leave.to_date || "-"}</td>
                  <td className="px-4 py-2 border">{leave.duration}</td>
                  <td className="px-4 py-2 border">{leave.reason}</td>
                  <td>
                    <FileUpload
                      isView={true}
                      isCombine={false}
                      initialFiles={
                        leave.leave_document ? [leaveDocumentUrl] : []
                      }
                      accept=".jpg,.jpeg,.png,.pdf"
                      onFilesSelected={() => {}}
                      onDeletedFiles={() => {}}
                    />
                  </td>
                  <td
                    className={`px-4 py-2 border text-center font-medium ${getStatusColor(
                      getStatusText(leave)
                    )}`}
                  >
                    {getStatusText(leave)}
                  </td>
                </tr>
              );
            })
        ) : (
          <tr>
            <td colSpan="7" className="text-center py-4">
              No leave requests found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )}
</div>


        {filteredLeaveRequests.length > employeesPerPage && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 rounded-md bg-blue-500 text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 mx-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 rounded-md bg-blue-500 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequest;