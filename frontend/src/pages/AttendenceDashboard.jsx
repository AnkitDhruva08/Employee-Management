import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Select from "react-select";
import {
  fetchEmployees,
  fetchDashboardLink,
  fetchDashboard,
  fetchEmployeesAttendance
} from "../utils/api";
import CompanyLogo from "../components/CompanyLogo";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import EmployeeReport from "../components/attendance/EmployeeReport";
import SalaryCalculator from "../components/attendance/SalaryCalculator";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Attendance = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [dateFilter, setDateFilter] = useState({ type: "", date: "", start: "", end: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company");
  const navigate = useNavigate();

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "0.00";

    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const durationMs = outTime - inTime;

    if (durationMs < 0) return "0.00";

    const hours = durationMs / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const empData = await fetchEmployees(token);
      setEmployees(empData);

      const links = await fetchDashboardLink(token);
      setQuickLinks(links);

      const dashboardInfo = await fetchDashboard(token);
      setDashboardData(dashboardInfo);

      const filters = {
        employeeId: selectedEmployee,
        month: selectedMonth,
        year: selectedYear,
      };

      if (dateFilter.type === "date" && dateFilter.date) {
        filters.specificDate = dateFilter.date;
      } else if (dateFilter.type === "range" && dateFilter.start && dateFilter.end) {
        filters.startDate = dateFilter.start;
        filters.endDate = dateFilter.end;
      }

      const attData = await fetchEmployeesAttendance(token, filters);

      if (attData && attData.data) {
        const processedAttendance = attData.data.map(record => ({
          ...record,
          totalHours: calculateDuration(record.check_in, record.check_out)
        }));
        setAttendanceRecords(processedAttendance);
      } else {
        setAttendanceRecords([]);
        Swal.fire("message", attData.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Failed to fetch attendance data.", "error");
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedMonth, selectedYear, selectedEmployee, dateFilter, roleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEmployeeById = (id) => {
    return employees.find(emp => String(emp.id) === String(id));
  };

  const handleExportExcel = () => {
    const formattedData = attendanceRecords.map((record, index) => ({
      "Sr No.": index + 1,
      Employee: record.user_name || "",
      Date: record.date || "",
      "Check-In": record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "",
      "Check-Out": record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "",
      "Hours Spent": record.totalHours || "0.00",
      Status: record.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Attendance.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 10);
    const tableData = attendanceRecords.map((record, index) => [
      index + 1,
      record.user_name,
      record.date,
      record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "",
      record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "",
      `${record.totalHours} hrs`,
      record.status,
    ]);

    doc.autoTable({
      head: [["#", "Employee", "Date", "Check-In", "Check-Out", "Hours", "Status"]],
      body: tableData,
    });
    doc.save("Attendance.pdf");
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const yearOptions = years.map(year => ({
    label: year.toString(),
    value: year,
  }));

  const employeeOptions = [
    { label: "All Employees", value: "all" },
    ...employees.map(emp => ({
      label: emp.username,
      value: emp.id,
    })),
  ];

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Present", value: "present" },
    { label: "Absent", value: "absent" },
    { label: "Holiday", value: "holiday" },
    { label: "Leave", value: "leave" },
  ];

  const getAttendanceChartData = () => {
    const statusCounts = attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: 'Number of Days',
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getHoursSpentChartData = () => {
    const employeeHours = attendanceRecords.reduce((acc, record) => {
      if (record.user_name && record.totalHours) {
        acc[record.user_name] = (acc[record.user_name] || 0) + parseFloat(record.totalHours);
      }
      return acc;
    }, {});

    return {
      labels: Object.keys(employeeHours),
      datasets: [
        {
          label: 'Total Hours Spent',
          data: Object.values(employeeHours),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="bg-gray-800 text-white w-64 p-6">
        {dashboardData && (
          <CompanyLogo
            companyName={dashboardData.company}
            logoPath={dashboardData.company_logo}
          />
        )}
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <Header title="Employee Attendance" />
        <div className="flex flex-col h-screen  text-blue-500 p-4">
          <header className="bg-white p-4 rounded-lg shadow-xl mb-4 flex justify-between items-center text-blue-500 border-gray-200">
            <nav className="flex space-x-4">
              <button
                className={`py-2 px-4 rounded-md font-medium transition-colors duration-200
      ${activeTab === "attendance" ? 'bg-purple-700 text-white shadow-lg' : 'text-blue-600 hover:bg-gray-200 hover:text-black'}`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance
              </button>
              <button
                className={`py-2 px-4 rounded-md font-medium transition-colors duration-200
      ${activeTab === "salary" ? 'bg-purple-700 text-white shadow-lg' : 'text-blue-600 hover:bg-gray-200 hover:text-black'}`}
                onClick={() => setActiveTab("salary")}
              >
                Salary Calculation
              </button>
              <button
                className={`py-2 px-4 rounded-md font-medium transition-colors duration-200
      ${activeTab === "report" ? 'bg-purple-700 text-white shadow-lg' : 'text-blue-600 hover:bg-gray-200 hover:text-black'}`}
                onClick={() => setActiveTab("report")}
              >
                Employee Reports
              </button>
            </nav>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span>Filter Attendance</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Select Month</label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find(option => option.value === selectedMonth)}
                  onChange={option => setSelectedMonth(option.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Select Year</label>
                <Select
                  options={yearOptions}
                  value={yearOptions.find(option => option.value === selectedYear)}
                  onChange={option => setSelectedYear(option.value)}
                />
              </div>

              {(roleId === 1 || roleId === 2 || isCompany) && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Select Employee</label>
                  <Select
                    options={employeeOptions}
                    value={employeeOptions.find(option => option.value === selectedEmployee)}
                    onChange={option => setSelectedEmployee(option.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Specific Date</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={dateFilter.type === "date" ? dateFilter.date : ""}
                  onChange={(e) =>
                    setDateFilter({ type: "date", date: e.target.value, start: "", end: "" })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Start Date (Range)</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={dateFilter.type === "range" ? dateFilter.start : ""}
                  onChange={(e) =>
                    setDateFilter(prev => ({ ...prev, type: "range", start: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">End Date (Range)</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={dateFilter.type === "range" ? dateFilter.end : ""}
                  onChange={(e) =>
                    setDateFilter(prev => ({ ...prev, type: "range", end: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth() + 1);
                    setSelectedYear(new Date().getFullYear());
                    setSelectedEmployee("all");
                    setDateFilter({ type: "", date: "", start: "", end: "" });
                  }}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-auto">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
              {activeTab === "attendance" && (
                <div className=" bg-white-200 p-6 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-black">Attendance Records</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 10v6m0 0l-3-3m3 3l3-3M5 4h5.586a1 1 0 01.707.293l6.414 6.414A1 1 0 0118 11v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                        Export Excel
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2m7 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z" />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="mt-4 text-lg">Loading attendance data...</p>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                      <span className="text-6xl mb-4">📅</span>
                      <p className="text-lg font-medium">No attendance records found.</p>
                      <p className="text-sm">Try adjusting the filters to see data.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Status Distribution</h3>
                          <Bar data={getAttendanceChartData()} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Hours Spent by Employee</h3>
                          <Bar data={getHoursSpentChartData()} />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-white-600">
                        <table className="min-w-full text-sm text-gray-700">
                          <thead className="bg-blue-50 text-gray-600 uppercase text-xs tracking-wider">
                            <tr>
                              {["Employee", "Date", "Check-In", "Check-Out", "Hours Spent", "Status"].map((head, i) => (
                                <th
                                  key={i}
                                  className={`px-6 py-4 text-left  ${i === 0 ? "rounded-tl-lg" : i === 5 ? "rounded-tr-lg" : ""
                                    }`}
                                >
                                  {head}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {[...attendanceRecords]
                              .sort((a, b) => new Date(a.date) - new Date(b.date))
                              .map(record => {
                                const employee = getEmployeeById(record.employeeId);
                                return (
                                  <tr
                                    key={`${record.attendance_id}-${record.date}`}
                                    className="hover:bg-blue-50 transition-all duration-150"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="flex items-center">
                                        <img
                                          className="h-9 w-9 rounded-full object-cover mr-3"
                                          src={
                                            employee?.avatar ||
                                            `https://placehold.co/40x40/6366F1/FFFFFF?text=${record.user_name?.substring(0, 2)}`
                                          }
                                          alt={record.user_name}
                                        />
                                        <span className="px-6 py-4">{record.user_name}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4">
                                      {record.check_in
                                        ? new Date(record.check_in).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                        : "N/A"}
                                    </td>
                                    <td className="px-6 py-4">
                                      {record.check_out
                                        ? new Date(record.check_out).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                        : "N/A"}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="bg-purple-700 text-purple-100 px-2 py-1 rounded-full text-xs font-semibold">
                                        {record.totalHours} hrs
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {record.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {activeTab === "salary" && (
              <SalaryCalculator
                attendanceRecords={attendanceRecords}
                employees={employees}
              />
            )}
            {activeTab === "report" && (
              <EmployeeReport
                employees={employees}
                attendanceRecords={attendanceRecords}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Attendance;