import React, { useEffect, useState } from "react";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import CompanyLogo from "../components/CompanyLogo";
import FileUpload from "../components/File/FileUpload";

const LeaveTable = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;
  const [quickLinks, setQuickLinks] = useState([]);
  const [comment, setComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const HeaderTitle = "Employee Leave Requests";
  const token = localStorage.getItem("token");
  const roleId = localStorage.getItem("role_id");
  const isCompany = localStorage.getItem("is_company") === "true";


  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token);
      const dashboardData = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboardData);
    } catch (err) {
      console.error("Failed to load quick links");
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  const fetchLeaveRequests = async () => {
    const res = await fetch("http://localhost:8000/api/leave-requests/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const leaveList = await res.json();

    setLeaveRequests(leaveList.data);
  };

  useEffect(() => {
    if (!token) return;
    fetchLeaveRequests();
    fetchLinks();
  }, []);

  const filteredLeaveRequests = leaveRequests
    .filter((leave) => {
      const name =
        leave.username ||
        `${leave.employee?.first_name} ${leave.employee?.last_name}`;
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .filter((leave) => {
      if (isCompany) {
        return leave.status === "Admin Approved";
      }
      return true;
    });

  const currentLeaveRequests = filteredLeaveRequests.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const totalPages = Math.ceil(filteredLeaveRequests.length / employeesPerPage);

  const handleApproveLeave = async (leaveId, type, commentText) => {
    const data = {
      status: type,
      leave_id: leaveId,
      comment: commentText,
    };

    const res = await fetch(
      `http://localhost:8000/api/leave-requests/${leaveId}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const results = await res.json();
    if (res.ok) {
      fetchLeaveRequests();
      setModalOpen(false);
    } else {
      console.log("Error:", results);
    }
  };

  const renderStatusBadge = (status) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-sm font-semibold shadow-md";

    switch (status) {
      case "Admin Approved":
        return (
          <span className={`${baseClasses} bg-green-500 text-white`}>
            Approved
          </span>
        );
      case "HR Approved":
        return (
          <span className={`${baseClasses} bg-blue-500 text-white`}>
            Forwarded
          </span>
        );
      case "Admin Rejected":
      case "HR Rejected":
        return (
          <span className={`${baseClasses} bg-red-500 text-white`}>
            Rejected
          </span>
        );
      default:
        return (
          <span
            className={`${baseClasses} bg-yellow-500 text-white animate-pulse`}
          >
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && <CompanyLogo logoPath={dashboardData.company_logo} />}
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header title={HeaderTitle} />

        <div className="mx-[10px] bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t mt-6 mb-0">
          <h2 className="text-xl font-semibold">
            Leave <span className="font-bold">Requests</span>
          </h2>

          <div className="w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Search by name or leave type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-t shadow-md rounded overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 border text-left">Name</th>
                <th className="p-3 border text-left">Leave Type</th>
                <th className="p-3 border text-left">From</th>
                <th className="p-3 border text-left">To</th>
                <th className="p-3 border text-left">Reason</th>
                <th className="p-3 border text-left">Attached Documents</th>
                <th className="p-3 border text-left">Comments </th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((leave) => (
                <tr
                  key={leave.id}
                  className="border hover:bg-blue-50 even:bg-gray-50 transition duration-200 ease-in-out"
                >
                  <td className="p-3 border">
                    {leave.username ||
                      `${leave.employee?.first_name} ${leave.employee?.last_name}`}
                  </td>
                  <td className="p-3 border">
                    {leave.leave_type === "CL"
                      ? "Casual Leave"
                      : "Personal Leave"}
                  </td>
                  <td className="p-3 border">{leave.from_date}</td>
                  <td className="p-3 border">{leave.to_date || "—"}</td>
                  <td className="p-3 border">{leave.reason}</td>
                  <td className="p-3 border">
                    <FileUpload
                      isView={true}
                      isCombine={false}
                      initialFiles={
                        leave.leave_document
                          ? [
                              `http://localhost:8000/${
                                leave.leave_document.startsWith("media/")
                                  ? ""
                                  : "media/"
                              }${leave.leave_document}`,
                            ]
                          : []
                      }
                      accept=".jpg,.jpeg,.png,.pdf"
                      onFilesSelected={() => {}}
                      onDeletedFiles={() => {}}
                    />
                  </td>
                  <td className="p-3 border">{leave.comment || "—"}</td>
                  <td className="p-3 border">
                    {renderStatusBadge(leave.status)}
                  </td>
                  <td className="p-3 border">
                    {Number(roleId) === Number(leave.employee__role_id) ? (
                      <span className="text-sm text-gray-400">No Actions</span>
                    ) : (
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setModalOpen(true);
                        }}
                      >
                        Take Action
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 bg-white border-t text-sm rounded-b gap-2">
          <span className="text-gray-700">
            Showing {currentLeaveRequests.length} out of{" "}
            {filteredLeaveRequests.length} filtered entries
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border ${
                  currentPage === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal for Approval/Rejection */}
        {modalOpen && selectedLeave && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] sm:w-[400px] relative space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Leave Action</h3>

      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <strong>Name:</strong>{" "}
          {selectedLeave.username ||
            `${selectedLeave.employee?.first_name} ${selectedLeave.employee?.last_name}`}
        </p>
        <p>
          <strong>Leave Type:</strong> {selectedLeave.leave_type}
        </p>
        <p>
          <strong>Reason:</strong> {selectedLeave.reason}
        </p>
      </div>

      {/* Comments Field */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comments (Optional)
        </label>
        <textarea
          id="comment"
          rows={4}
          className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Write your comment here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() =>
            handleApproveLeave(
              selectedLeave.id,
              roleId === "2" ? "HR Approved" : "Admin Approved",
              comment
            )
          }
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          Approve
        </button>
        <button
          onClick={() =>
            handleApproveLeave(
              selectedLeave.id,
              roleId === "2" ? "HR Rejected" : "Admin Rejected",
              comment
            )
          }
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          Reject
        </button>
        <button
          onClick={() => setModalOpen(false)}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default LeaveTable;
