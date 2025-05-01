import React, { useEffect, useState } from "react";
import Header from "../components/header/Header";
import { fetchDashboardLink, fetchDashboard } from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";

const LeaveTable = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;
  const [quickLinks, setQuickLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const HeaderTitle = "Employee Leave Requests";
  const token = localStorage.getItem("token");
  const roleId = localStorage.getItem("role_id");

  const url =
    roleId === "2"
      ? "http://localhost:8000/api/hr-dashboard-link/"
      : "http://localhost:8000/api/company-dashboard-link/";

  // Fetch dashboard links and data
  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token, url);
      const dashboardData = await fetchDashboard(token);
      setQuickLinks(links);
      setDashboardData(dashboardData);
    } catch (err) {
      console.error("Failed to load quick links");
    }
  };

  const fetchLeaveRequests = async () => {
    const res = await fetch("http://localhost:8000/api/leave-requests/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Leave Requests:", data);
    const list = data.results || data.data || [];
    setLeaveRequests(list);
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLinks();
  }, []);

  const filteredLeaveRequests = leaveRequests.filter((leave) => {
    const name =
      leave.username ||
      `${leave.employee?.first_name} ${leave.employee?.last_name}`;
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

  //  function for Approved or reject Leave
  const handleApproveLeave = async (leaveId, type) => {
    const data = {
      status: type,
      leave_id: leaveId,
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
    switch (status) {
      case "Admin Approved":
        return <span className="text-green-600 font-semibold">Approved</span>;
      case "HR Approved":
        return <span className="text-blue-500 font-semibold">Forward</span>;
      case "Admin Rejected":
      case "HR Rejected":
        return <span className="text-red-500 font-semibold">Rejected</span>;
      default:
        return <span className="text-gray-600 font-medium">Pending</span>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData ? (
          <h2 className="text-xl font-semibold text-white">
            {dashboardData.company}
          </h2>
        ) : (
          <h2 className="text-xl font-semibold text-white">Loading...</h2>
        )}
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
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

        {/* Leave Requests Table */}
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-t shadow-md rounded overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 border text-left">Name</th>
                <th className="p-3 border text-left">Leave Type</th>
                <th className="p-3 border text-left">From</th>
                <th className="p-3 border text-left">To</th>
                <th className="p-3 border text-left">Reason</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaveRequests.map((leave) => (
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
                    {renderStatusBadge(leave.status)}
                  </td>
                  <td className="p-3 border">
                    {leave.status === "Admin Approved" ||
                    (leave.status === "HR Approved" && roleId === "2") ? (
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
            <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] sm:w-[400px] relative">
              <h3 className="text-xl font-semibold mb-4">Leave Action</h3>
              <p className="mb-2">
                <strong>Name:</strong>{" "}
                {selectedLeave.username ||
                  `${selectedLeave.employee?.first_name} ${selectedLeave.employee?.last_name}`}
              </p>
              <p className="mb-2">
                <strong>Leave Type:</strong> {selectedLeave.leave_type}
              </p>
              <p className="mb-4">
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() =>
                    handleApproveLeave(selectedLeave.id, "Admin Approved")
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleApproveLeave(selectedLeave.id, "HR Rejected")
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="ml-2 px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
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
