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
import {
  fetchEmployees,
  fetchDashboardLink,
  fetchDashboard,
} from "../utils/api";
import CompanyLogo from "../components/CompanyLogo";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";

// --- Utility: Dummy Data Generation ---
const generateDummyData = () => {
  const employees = [
    { id: 'emp1', name: 'Alice Smith', hourlyRate: 25, avatar: 'https://placehold.co/40x40/6366F1/FFFFFF?text=AS' },
    { id: 'emp2', name: 'Bob Johnson', hourlyRate: 30, avatar: 'https://placehold.co/40x40/EF4444/FFFFFF?text=BJ' },
    { id: 'emp3', name: 'Charlie Brown', hourlyRate: 20, avatar: 'https://placehold.co/40x40/10B981/FFFFFF?text=CB' },
    { id: 'emp4', name: 'Diana Prince', hourlyRate: 28, avatar: 'https://placehold.co/40x40/F59E0B/FFFFFF?text=DP' },
    { id: 'emp5', name: 'Eve Adams', hourlyRate: 35, avatar: 'https://placehold.co/40x40/8B5CF6/FFFFFF?text=EA' },
  ];

  const attendanceRecords = [];
  const today = new Date();

  // Generate data for the last 3 months
  for (let m = 0; m < 3; m++) {
    const currentMonth = today.getMonth() - m;
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    employees.forEach(emp => {
      for (let day = 1; day <= daysInMonth; day++) {
        const recordDate = new Date(currentYear, currentMonth, day);
        // Only generate attendance for weekdays (Monday to Friday)
        if (recordDate.getDay() !== 0 && recordDate.getDay() !== 6) {
          // Simulate check-in between 8:00 and 9:30 AM
          const checkInHour = Math.floor(Math.random() * 2) + 8; // 8 or 9
          const checkInMinute = Math.floor(Math.random() * 60);
          const checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}`;

          // Simulate check-out between 5:00 and 6:30 PM (after at least 8 hours)
          const checkOutHour = Math.floor(Math.random() * 2) + 17; // 17 or 18
          const checkOutMinute = Math.floor(Math.random() * 60);
          const checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}`;

          // Calculate total hours spent
          const inTime = new Date(`2000/01/01 ${checkInTime}`);
          const outTime = new Date(`2000/01/01 ${checkOutTime}`);
          const diffMs = outTime.getTime() - inTime.getTime();
          const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place

          attendanceRecords.push({
            id: `${emp.id}-${recordDate.toISOString().split('T')[0]}`,
            employeeId: emp.id,
            date: recordDate.toISOString().split('T')[0], // YYYY-MM-DD
            checkIn: checkInTime,
            checkOut: checkOutTime,
            totalHours: totalHours > 0 ? totalHours : 0, // Ensure non-negative hours
          });
        }
      }
    });
  }

  return { employees, attendanceRecords };
};

// --- Main Attendance Component ---
const Attendance = () => { 
  const [data, setData] = useState({ employees: [], attendanceRecords: [] });
  const [activeTab, setActiveTab] = useState('attendance'); 

  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [attendance, setAttendance] = useState([])
  // const [attendanceData, setAttendanceData] = useState({
  //   employee: "",
  //   date: "",
  //   status: "",
  // });
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
    records?.forEach((record) => {
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

      const result = await response.json();
      console.log("Attendance data:", result);
      setAttendance(result.data);

      // Block if profile is incomplete
      if (result.is_complete === false) {
        Swal.fire({
          icon: "warning",
          title: "Profile Incomplete",
          text:
            data.message ||
            "Please complete your profile before accessing attendance features.",
          footer: `Missing: ${data.missing_sections || "Required Sections"}`,
        });
        navigate("/dashboard");
        return;
      }

      // Everything is fine
      return result.data || [];
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while loading attendance records.",
      });
      return null;
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
      const employeeData = attData?.filter(
        (record) => String(record.id) === String(roleId)
      );
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

        const newFiltered =
          roleId === 3
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
      const matchesMonth =
        month !== "" ? recordDate.getMonth() === Number(month) : true;
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
    const formattedData = filteredRecords?.map((record, index) => ({
      "Sr No.": index + 1,
      Employee: record.username || "",
      Date: record.date || "",
      "Login Time": record.login_time
        ? new Date(record.login_time).toLocaleTimeString()
        : "",
      "Logout Time": record.logout_time
        ? new Date(record.logout_time).toLocaleTimeString()
        : "",
      "Duration (hrs)": record.duration_hours?.toFixed(2) || "0.00",
      Status: record.status || "",
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
    const tableData = filteredRecords?.map((record, index) => [
      index + 1,
      record.username,
      record.date,
      new Date(record.login_time).toLocaleTimeString(),
      new Date(record.logout_time).toLocaleTimeString(),
      `${record.duration_hours?.toFixed(2)} hrs`,
      record.status,
    ]);

    doc.autoTable({
      head: [
        ["#", "Employee", "Date", "Login", "Logout", "Duration", "Status"],
      ],
      body: tableData,
    });
    doc.save("Attendance.pdf");
  };

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  useEffect(() => {
    setData(generateDummyData());
  }, []);

  const getEmployeeById = (id) => data.employees.find(emp => emp.id === id);

  const filterAttendanceByMonth = (records, month, year) => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i); // Current year +/- 2
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' }),
  }));

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'attendance':
        return 'Employee Attendance';
      case 'salary':
        return 'Salary Calculation';
      case 'report':
        return 'Employee Reports';
      default:
        return 'HR Connect';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        {dashboardData && (
          <CompanyLogo
            companyName={dashboardData.company}
            logoPath={dashboardData.company_logo}
          />
        )}
        <div className="flex justify-center mt-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="flex min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Sidebar Component */}
      

      <div className="flex-1 flex flex-col">
      <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans p-4">
      {/* Header */}
      <header className="bg-gray-800 p-4 rounded-lg shadow-xl mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-400">HR Connect</h1>
        <nav className="flex space-x-4">
          <TabButton name="Attendance" activeTab={activeTab} onClick={() => setActiveTab('attendance')} />
          <TabButton name="Salary Calculation" activeTab={activeTab} onClick={() => setActiveTab('salary')} />
          <TabButton name="Employee Reports" activeTab={activeTab} onClick={() => setActiveTab('report')} />
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-800 rounded-lg shadow-xl p-6 overflow-hidden flex flex-col">
        {/* Month/Year Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <label htmlFor="month-select" className="text-gray-300 font-medium">Select Month:</label>
          <select
            id="month-select"
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>

          <label htmlFor="year-select" className="text-gray-300 font-medium">Select Year:</label>
          <select
            id="year-select"
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Content based on activeTab */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-2 -mr-2">
          {activeTab === 'attendance' && (
            <AttendanceTracker
              attendanceRecords={filterAttendanceByMonth(attendance, selectedMonth, selectedYear)}
              employees={data.employees}
              getEmployeeById={getEmployeeById}
            />
          )}
          {activeTab === 'salary' && (
            <SalaryCalculator
              attendanceRecords={filterAttendanceByMonth(data.attendanceRecords, selectedMonth, selectedYear)}
              employees={data.employees}
            />
          )}
          {activeTab === 'report' && (
            <EmployeeReport
              employees={data.employees}
              attendanceRecords={data.attendanceRecords} 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}
        </div>
      </main>
    </div>

      </div>
    </div>
      </div>
   
    

    </div>
  );
};

// --- Tab Button Component ---
const TabButton = ({ name, activeTab, onClick }) => {
  const isActive = activeTab === name.toLowerCase().replace(' ', '');
  return (
    <button
      className={`py-2 px-4 rounded-md font-medium transition-colors duration-200
        ${isActive ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
      onClick={onClick}
    >
      {name}
    </button>
  );
};





// --- Attendance Tracker Component ---
const AttendanceTracker = ({ attendanceRecords, employees, getEmployeeById }) => {
  if (attendanceRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <span className="text-6xl mb-4">🗓️</span>
        <p className="text-lg">No attendance records found for this month.</p>
        <p className="text-sm">Please select a different month or year.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Attendance Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                Employee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Check-In
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Check-Out
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                Hours Spent
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-700 divide-y divide-gray-600">
            {attendanceRecords
              .sort((a, b) => new Date(a.date) - new Date(b.date)) 
              .map(record => {
                const employee = getEmployeeById(record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-gray-600 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-9 w-9 rounded-full object-cover mr-3"
                          src={employee?.avatar}
                          alt={record.user_name?.name}
                          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/40x40/6366F1/FFFFFF?text=${record?.user_name.substring(0,2)}` }}
                        />
                        <div className="text-sm font-medium text-gray-100">{record.user_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
  {new Date(record.check_in).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
  {new Date(record.check_out).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}
</td>


                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="bg-purple-800 text-purple-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {record.totalHours} hrs
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Salary Calculator Component ---
const SalaryCalculator = ({ attendanceRecords, employees }) => {
  const calculateSalaries = () => {
    const monthlyHours = {};
    employees.forEach(emp => {
      monthlyHours[emp.id] = { totalHours: 0, employee: emp };
    });

    attendanceRecords.forEach(record => {
      if (monthlyHours[record.employeeId]) {
        monthlyHours[record.employeeId].totalHours += record.totalHours;
      }
    });

    return Object.values(monthlyHours).map(data => ({
      ...data.employee,
      totalMonthlyHours: Math.round(data.totalHours * 10) / 10,
      monthlySalary: (data.totalHours * data.employee.hourlyRate).toFixed(2),
    }));
  };

  const calculatedSalaries = calculateSalaries();

  if (calculatedSalaries.length === 0 || calculatedSalaries.every(s => s.totalMonthlyHours === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <span className="text-6xl mb-4">💰</span>
        <p className="text-lg">No salary data available for this month.</p>
        <p className="text-sm">Ensure attendance records exist for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Monthly Salary Overview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                Employee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Hourly Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Total Hours (Month)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                Calculated Salary
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-700 divide-y divide-gray-600">
            {calculatedSalaries.map(salary => (
              <tr key={salary.id} className="hover:bg-gray-600 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-9 w-9 rounded-full object-cover mr-3"
                      src={salary.avatar}
                      alt={salary.name}
                      onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/40x40/6366F1/FFFFFF?text=${salary.name.substring(0,2)}` }}
                    />
                    <div className="text-sm font-medium text-gray-100">{salary.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${salary.hourlyRate}/hr</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span className="bg-blue-800 text-blue-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {salary.totalMonthlyHours} hrs
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-400">${salary.monthlySalary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Employee Report Component ---
const EmployeeReport = ({ employees, attendanceRecords, selectedMonth, selectedYear }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id); // Select first employee by default
    }
  }, [employees, selectedEmployeeId]);

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <span className="text-6xl mb-4">📋</span>
        <p className="text-lg">No employee data to generate reports.</p>
      </div>
    );
  }

  const employee = employees.find(emp => emp.id === selectedEmployeeId);
  const filteredRecords = attendanceRecords.filter(record =>
    record.employeeId === selectedEmployeeId &&
    new Date(record.date).getMonth() + 1 === selectedMonth &&
    new Date(record.date).getFullYear() === selectedYear
  );

  const totalMonthlyHours = filteredRecords.reduce((sum, record) => sum + record.totalHours, 0);
  const monthlySalary = employee ? (totalMonthlyHours * employee.hourlyRate).toFixed(2) : '0.00';
  const totalWorkingDays = filteredRecords.length;
  const avgDailyHours = totalWorkingDays > 0 ? (totalMonthlyHours / totalWorkingDays).toFixed(1) : '0.0';

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-gray-100 mb-6">Employee Performance Report</h2>

      <div className="flex items-center space-x-4 mb-8">
        <label htmlFor="employee-select" className="text-gray-300 font-medium">Select Employee:</label>
        <select
          id="employee-select"
          className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
        >
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {employee ? (
        <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-600 pb-4 mb-4">
            <div className="flex items-center">
              <img
                className="h-16 w-16 rounded-full object-cover border-2 border-purple-500 mr-4"
                src={employee.avatar}
                alt={employee.name}
                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/60x60/6366F1/FFFFFF?text=${employee.name.substring(0,2)}` }}
              />
              <div>
                <h3 className="text-2xl font-bold text-gray-100">{employee.name}</h3>
                <p className="text-purple-400 text-sm">Hourly Rate: ${employee.hourlyRate}/hr</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-300">
                {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg shadow-inner flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Working Days</p>
                <p className="text-2xl font-bold text-green-400">{totalWorkingDays}</p>
              </div>
              <span className="text-4xl">🗓️</span>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-inner flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Hours Spent</p>
                <p className="text-2xl font-bold text-blue-400">{totalMonthlyHours} hrs</p>
              </div>
              <span className="text-4xl">⏱️</span>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-inner flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Average Daily Hours</p>
                <p className="text-2xl font-bold text-yellow-400">{avgDailyHours} hrs</p>
              </div>
              <span className="text-4xl">☀️</span>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-inner flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Calculated Monthly Salary</p>
                <p className="text-3xl font-bold text-purple-400">${monthlySalary}</p>
              </div>
              <span className="text-4xl">💵</span>
            </div>
          </div>

          <h4 className="text-xl font-semibold text-gray-100 mt-6 mb-4 border-b border-gray-600 pb-2">Daily Attendance Details</h4>
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700 pr-2">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase rounded-tl-lg">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Check-In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Check-Out</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase rounded-tr-lg">Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {filteredRecords
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(record => (
                      <tr key={record.id} className="hover:bg-gray-600 transition-colors duration-150">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{record.checkIn}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{record.checkOut}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{record.totalHours}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No detailed attendance records for this month.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <span className="text-6xl mb-4">⚠️</span>
          <p className="text-lg">Please select an employee to view their report.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;
