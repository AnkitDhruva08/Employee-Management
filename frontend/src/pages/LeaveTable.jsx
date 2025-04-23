import React, { useEffect, useState } from "react";

const LeaveTable = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;
  const [activeDropdown, setActiveDropdown] = useState(null);

  const token = localStorage.getItem("token");

  const fetchLeaveRequests = async () => {
    const res = await fetch("http://localhost:8000/api/leave-requests/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const list = data.results || data.data || [];
    setLeaveRequests(list);
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const currentLeaveRequests = leaveRequests.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const totalPages = Math.ceil(leaveRequests.length / employeesPerPage);
  const handleApproveLeave = async (leaveId, type) => {
    console.log('type:', type, 'leaveId:', leaveId);
  
    const data = {
      status: type,
      leave_id: leaveId,
    };
  
    const res = await fetch(`http://localhost:8000/api/leave-requests/${leaveId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),  // Send the data as JSON
    });
  
    const results = await res.json();
    console.log("Updated leave request:", results);
    if (res.ok) {
      fetchLeaveRequests();
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

  const handleDropdownToggle = (leaveId) => {
    setActiveDropdown((prev) => (prev === leaveId ? null : leaveId));
  };

  return (
    <div className="max-w-[100rem] mx-auto mt-8 font-sans border rounded shadow-md px-4 sm:px-6 lg:px-8 overflow-x-auto">
      <div className="bg-[#2b4d76] text-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 rounded-t">
        <h2 className="text-xl font-semibold">
          Leave <span className="font-bold">Requests</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-t">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 border text-left">Name</th>
              <th className="p-3 border text-left">Leave Type</th>
              <th className="p-3 border text-left">From Date</th>
              <th className="p-3 border text-left">To Date</th>
              <th className="p-3 border text-left">Reason</th>
              <th className="p-3 border text-left">Status</th>
              <th className="p-3 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentLeaveRequests.map((leave) => (
              <tr key={leave.id} className="border hover:bg-gray-50">
                <td className="p-3 border">{leave.username || `${leave.employee?.first_name} ${leave.employee?.last_name}`}</td>
                <td className="p-3 border">
                  {leave.leave_type === "CL" ? "Casual Leave" : "Personal Leave"}
                </td>
                <td className="p-3 border">{leave.from_date}</td>
                <td className="p-3 border">{leave.to_date || "—"}</td>
                <td className="p-3 border">{leave.reason}</td>
                <td className="p-3 border">{renderStatusBadge(leave.status)}</td>
                <td className="p-3 border">
                  {leave.status !== "Admin Approved" && (
                    <div className="relative inline-block text-left">
                      <button
                        className="inline-flex justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                        onClick={() => handleDropdownToggle(leave.id)}
                      >
                        Action ▾
                      </button>
                      {activeDropdown === leave.id && (
                        <div className="origin-top-right absolute z-10 mt-1 w-36 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform">
                          <div className="py-1 text-sm">
                            <button
                              onClick={() => handleApproveLeave(leave.id, "Admin Approved")}
                              className="w-full px-4 py-2 text-left text-green-700 hover:bg-green-100 flex items-center gap-2 rounded-md"
                            >
                              <i className="fas fa-check-circle"></i> Approved
                            </button>
                            <button
                              onClick={() => handleApproveLeave(leave.id, "HR Rejected")}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-100 flex items-center gap-2 rounded-md"
                            >
                              <i className="fas fa-times-circle"></i> Rejected
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {leave.status === "Admin Approved" && (
                    <span className="text-sm text-gray-400">No Actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 bg-white border-t text-sm rounded-b gap-2">
        <span className="text-gray-700">
          Showing {currentLeaveRequests.length} out of {leaveRequests.length} entries
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
                currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
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
    </div>
  );
};

export default LeaveTable;
