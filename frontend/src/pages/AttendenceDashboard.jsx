import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchEmployees, fetchDashboardLink, fetchDashboard } from "../utils/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    employee: "",
    date: "",
    status: "",
  });
  const [filters, setFilters] = useState({
    employee: "",
    status: "",
    fromDate: "",
    toDate: "",
    search: "",
    month: "",
  });
  const [summary, setSummary] = useState([]);
  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));

  const HeaderTitle = "Employee Attendance";
  const attendanceStatusOptions = ["Present", "Absent", "Leave"];

  const generateSummary = (records) => {
    const summaryMap = {};
    records.forEach((record) => {
      const month = new Date(record.date).toLocaleString("default", {
        month: "short",
      });
      if (!summaryMap[month]) {
        summaryMap[month] = { Present: 0, Absent: 0, Leave: 0 };
      }
      summaryMap[month][record.status]++;
    });

    const data = Object.entries(summaryMap).map(([month, counts]) => ({
      month,
      ...counts,
    }));
    setSummary(data);
  };

  const fetchEmployeesAttendance = async (token) => {
    try {
      const response = await fetch("http://localhost:8000/api/attendance/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }
  };

  const fetchData = async () => {
    let empData = [];
if (roleId !== 3) {
  empData = await fetchEmployees(token);
}
    const attData = await fetchEmployeesAttendance(token);
    const links = await fetchDashboardLink(token);
    const dashboardData = await fetchDashboard(token);

    setQuickLinks(links);
    setDashboardData(dashboardData);
    setEmployees(empData);
    setAttendanceRecords(attData);

    if (roleId === 3) {
      const employeeData = attData.filter((record) => String(record.id) === String(roleId));
      setFilteredRecords(employeeData);
      generateSummary(employeeData);
    } else {
      setFilteredRecords(attData);
      generateSummary(attData);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData({ ...attendanceData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      ...attendanceData,
      employee: roleId === 3 ? roleId : attendanceData.employee,
    };

    try {
      const response = await fetch("http://localhost:8000/api/attendance/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const newRecord = await response.json();
        const updatedRecords = [...attendanceRecords, newRecord];
        setAttendanceRecords(updatedRecords);

        const newFiltered = roleId === 3
          ? updatedRecords.filter((record) => String(record.id))
          : updatedRecords;

        setFilteredRecords(newFiltered);
        generateSummary(newFiltered);
        setAttendanceData({ employee: "", date: "", status: "" });

        Swal.fire("Success", "Attendance recorded successfully", "success");
      } else {
        Swal.fire("Error", "Failed to record attendance", "error");
      }
    } catch {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };


  
  const applyFilters = () => {
    const { employee, status, fromDate, toDate, search, month } = filters;

    const filtered = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date);
      const matchesEmployee = employee ? String(record.id) === employee : true;
      const matchesStatus = status ? record.status === status : true;
      const matchesFrom = fromDate ? recordDate >= new Date(fromDate) : true;
      const matchesTo = toDate ? recordDate <= new Date(toDate) : true;
      const matchesMonth = month !== "" ? recordDate.getMonth() === Number(month) : true;
      const matchesSearch =
        !search ||
        record.username?.toLowerCase().includes(search.toLowerCase()) ||
        record.email?.toLowerCase().includes(search.toLowerCase());

      return (
        matchesEmployee &&
        matchesStatus &&
        matchesFrom &&
        matchesTo &&
        matchesSearch &&
        matchesMonth
      );
    });

    setFilteredRecords(filtered);
    generateSummary(filtered);
  };

  const exportToExcel = () => {
    const formattedData = filteredRecords.map((record, index) => ({
      "Sr No.": index + 1,
      "Employee": record.username || "",
      "Date": record.date || "",
      "Login Time": record.login_time ? new Date(record.login_time).toLocaleTimeString() : "",
      "Logout Time": record.logout_time ? new Date(record.logout_time).toLocaleTimeString() : "",
      "Duration (hrs)": record.duration_hours?.toFixed(2) || "0.00",
      "Status": record.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "Attendance.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 10);
    const tableData = filteredRecords.map((record, index) => [
      index + 1,
      record.username,
      record.date,
      new Date(record.login_time).toLocaleTimeString(),
      new Date(record.logout_time).toLocaleTimeString(),
      `${record.duration_hours?.toFixed(2)} hrs`,
      record.status,
    ]);

    doc.autoTable({
      head: [["#", "Employee", "Date", "Login", "Logout", "Duration", "Status"]],
      body: tableData,
    });
    doc.save("Attendance.pdf");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <h2 className="text-xl font-semibold">{dashboardData?.company}</h2>
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="p-6 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Form for Everyone */}
            <h3 className="text-2xl font-bold text-blue-700 mb-6">
              {roleId === 3 ? "Apply for Leave" : "Record Attendance"}
            </h3>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
              {roleId !== 3 && (
                <select
                  name="employee"
                  value={attendanceData.employee}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-lg"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.username}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="date"
                name="date"
                value={attendanceData.date}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-lg"
              />
              <select
                name="status"
                value={attendanceData.status}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-lg"
              >
                <option value="">Select Status</option>
                {["Present", "Absent", "Leave"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <button
                type="submit"
                className="col-span-1 md:col-span-3 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                {roleId === 3 ? "Submit Leave" : "Record"}
              </button>
            </form>

            {/* Filters and Table for Admin/HR */}
            {roleId !== 3 && (
              <>
                <div className="mt-10 bg-white p-4 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filter Controls */}
                  <input
                    type="text"
                    placeholder="Search name/email"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  />
                  <select
                    value={filters.employee}
                    onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.username}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  >
                    <option value="">All Statuses</option>
                    {attendanceStatusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  />
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="border px-3 py-2 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={applyFilters}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ employee: "", status: "", fromDate: "", toDate: "", search: "", month: "" });
                        setFilteredRecords(attendanceRecords);
                        generateSummary(attendanceRecords);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="mt-4 flex gap-4">
                  <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Export to Excel
                  </button>
                  <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Export to PDF
                  </button>
                </div>
              </>
            )}

            {/* Chart */}
            <div className="mt-10 bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Monthly Attendance Summary</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Present" stackId="a" fill="#4ade80" />
                  <Bar dataKey="Absent" stackId="a" fill="#f87171" />
                  <Bar dataKey="Leave" stackId="a" fill="#facc15" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            {roleId !== 3 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-blue-700 mb-4">Attendance Records</h3>
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th>Sr No.</th>
                        <th className="p-3 border">Employee</th>
                        <th className="p-3 border">Date</th>
                        <th className="p-3 border">Login Time</th>
                        <th className="p-3 border">LogOut Time</th>
                        <th className="p-3 border">Duration</th>
                        <th className="p-3 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="p-3 border">{index + 1}</td>
                        <td className="p-3 border">{record.username}</td>
                        <td className="p-3 border">{record.date ? record.date : ""}</td>
                        <td className="p-3 border">
                          {record.login_time ? new Date(record.login_time).toLocaleTimeString() : ""}
                        </td>
                        <td className="p-3 border">
                          {record.logout_time ? new Date(record.logout_time).toLocaleTimeString() : ""}
                        </td>
                        <td className="p-3 border">
                          {record.duration_hours != null ? `${record.duration_hours.toFixed(2)} hrs` : ""}
                        </td>
                        <td className="p-3 border">{record.status}</td>
                      </tr>
                    ))}

                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
