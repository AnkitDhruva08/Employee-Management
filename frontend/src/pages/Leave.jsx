import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [open, setOpen] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showSingleDate, setShowSingleDate] = useState(true);

  const [newLeave, setNewLeave] = useState({
    duration: "Single Day",
    leave_type: "PL",
    from_date: format(new Date(), "yyyy-MM-dd"),
    to_date: "",
    reason: "",
    attachment: null,
  });

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleOpen = () => setOpen(!open);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchLeaves = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/leave-requests/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        console.log('result ==<<>>', result);
        if (response.ok && Array.isArray(result.data)) {
          setLeaves(result.data);
        } else {
          setError("Failed to fetch leave data.");
        }
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [token, navigate]);

  // Update from/to dates based on duration selection
  useEffect(() => {
    const { startDate, endDate } = dateRange[0];

    if (newLeave.duration === "Multiple Days") {
      setShowRangePicker(true);
      setShowSingleDate(false);
      setNewLeave((prev) => ({
        ...prev,
        from_date: format(startDate, "yyyy-MM-dd"),
        to_date: format(endDate, "yyyy-MM-dd"),
      }));
    } else {
      setShowRangePicker(false);
      setShowSingleDate(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

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

      if (res.ok) {
        const newData = await res.json();
        setSuccess("Leave Applied Successfully");
        setLeaves((prev) => [...prev, newData]);
        setOpen(false);
        setNewLeave({
          duration: "Single Day",
          leave_type: "PL",
          from_date: format(new Date(), "yyyy-MM-dd"),
          to_date: "",
          reason: "",
          attachment: null,
        });
      } else {
        setError("Failed to apply leave.");
      }
    } catch {
      setError("Failed to connect to server.");
    }

  };

  const getStatusText = (leave) => {
    if (leave.admin_reviewed && leave.status === "Admin Approved") {
      return "Approved";
    }
    if (leave.hr_reviewed && leave.status === "HR Approved") {
      return "HR Approved";
    }
    if (leave.hr_reviewed && leave.status === "HR Rejected") {
      return "Rejected";
    }
    if (leave.admin_reviewed && leave.status === "Admin Rejected") {
      return "Rejected";
    }
    return "Pending";
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
    <div className="p-6">
      <button
        onClick={handleOpen}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
      >
        Apply for Leave
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg">
            <h2 className="text-2xl font-semibold text-center mb-6">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

{/* Leave Type */}
<div>
  <label htmlFor="leave_type" className="block text-gray-700 mb-1">Leave Type</label>
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

{/* Duration */}
<div>
  <label htmlFor="duration" className="block text-gray-700 mb-1">Duration</label>
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

{/* Date Fields */}
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">
    <label className="block text-gray-700 mb-1">From Date</label>
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
      <label className="block text-gray-700 mb-1">To Date</label>
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

{/* Reason */}
<div>
  <label htmlFor="reason" className="block text-gray-700 mb-1">Reason</label>
  <textarea
    id="reason"
    name="reason"
    value={newLeave.reason}
    onChange={handleChange}
    rows="4"
    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

{/* Attachment */}
<div>
  <label htmlFor="attachment" className="block text-gray-700 mb-1">Attachment</label>
  <input
    type="file"
    name="attachment"
    onChange={handleChange}
    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

{/* Buttons */}
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
    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
  >
    Submit
  </button>
</div>
</form>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Leave Status</h2>
        <table className="min-w-full table-auto border border-gray-300">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-2 border">Leave Type</th>
              <th className="px-4 py-2 border">From Date</th>
              <th className="px-4 py-2 border">To Date</th>
              <th className="px-4 py-2 border">Duration</th>
              <th className="px-4 py-2 border">Reason</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
  {leaves.map((leave, index) => (
    <tr key={index} className="odd:bg-gray-50 even:bg-white">
      <td className="px-4 py-2 border border-gray-300">{leave.leave_type}</td>
      <td className="px-4 py-2 border border-gray-300">{leave.from_date}</td>
      <td className="px-4 py-2 border border-gray-300">{leave.to_date || "-"}</td>
      <td className="px-4 py-2 border border-gray-300">{leave.duration}</td>
      <td className="px-4 py-2 border border-gray-300">{leave.reason}</td>
      <td className={`px-4 py-2 border border-gray-300 text-center font-medium rounded ${getStatusColor(getStatusText(leave))}`}>
        {getStatusText(leave)}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      {success && (
        <div className="fixed bottom-5 left-5 bg-green-500 text-white p-4 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed bottom-5 left-5 bg-red-500 text-white p-4 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default LeaveRequest;
