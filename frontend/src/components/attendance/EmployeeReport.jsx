import React, { useEffect, useState } from "react";
// Removed Swal, XLSX, jsPDF, react-select imports for standalone compilation
// If you want Excel/PDF export or SweetAlerts, ensure these libraries are installed
// and their import paths are correct in your actual project.

// Mocking external libraries for compilation purposes
const XLSX = {
  utils: {
    json_to_sheet: () => ({}),
    book_new: () => ({}),
    book_append_sheet: () => ({}),
  },
  write: () => new ArrayBuffer(0),
};
const saveAs = () => alert("File-saver not available in this preview.");
const jsPDF = function() {
  this.text = (txt, x, y) => console.log(`PDF Text: ${txt} at (${x},${y})`);
  this.autoTable = (options) => console.log("PDF Table options:", options);
  this.save = (filename) => alert(`PDF saved as: ${filename}`);
};

// Mock CompanyLogo, assuming it's part of the parent layout and not directly in EmployeeReport
// If this component were stand-alone, you'd need a proper CompanyLogo import.
const CompanyLogo = ({ companyName, logoPath }) => (
  <div className="text-center">
    <img src={logoPath} alt="Company Logo" className="mx-auto h-12 w-auto mb-2 rounded-full" />
    <h1 className="text-xl font-bold">{companyName}</h1>
  </div>
);


const EmployeeReport = ({ employees, attendanceRecords, selectedMonth, selectedYear }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Function to format time for display
  const formatTime = (datetime) => {
    return datetime
      ? new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : 'N/A';
  };

  useEffect(() => {
    // Set the first employee as default if no employee is selected
    if (employees.length > 0 && (!selectedEmployeeId || !employees.some(emp => emp.id === selectedEmployeeId))) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  // Handle case where no employee data is available
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
        <span className="text-6xl mb-4">📋</span>
        <p className="text-lg font-medium">No employee data available to generate reports.</p>
        <p className="text-sm">Please ensure employee data is loaded.</p>
      </div>
    );
  }

  // Find the currently selected employee
  const employee = employees.find(emp => String(emp.id) === String(selectedEmployeeId));

  // Filter attendance records for the selected employee, month, and year
  const filteredRecords = attendanceRecords.filter(record =>
    String(record.employee_id) === String(selectedEmployeeId) &&
    new Date(record.date).getMonth() + 1 === selectedMonth &&
    new Date(record.date).getFullYear() === selectedYear
  );

  // Calculate report metrics
  const totalMonthlyHours = filteredRecords.reduce((sum, record) => sum + (record.total_duration_hours || 0), 0);
  const monthlySalary = employee && employee.hourlyRate ? (totalMonthlyHours * employee.hourlyRate).toFixed(2) : '0.00';
  const totalWorkingDays = filteredRecords.filter(record => record.status === "Present").length; // Count only 'Present' days
  const avgDailyHours = totalWorkingDays > 0 ? (totalMonthlyHours / totalWorkingDays).toFixed(1) : '0.0';

  // Handle export to Excel
  const handleExportExcel = () => {
    if (!employee) {
      alert("Please select an employee to export the report.");
      return;
    }

    const formattedData = filteredRecords.map((record, index) => ({
      "Sr No.": index + 1,
      Date: record.date || "",
      "First Check-In": record.first_check_in ? formatTime(record.first_check_in) : "",
      "Last Check-Out": record.last_check_out ? formatTime(record.last_check_out) : "",
      "Hours Spent": record.total_duration_hours || "0.00",
      Status: record.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet([
      { "Employee Name": employee.username },
      { "Reporting Month": new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }) },
      {}, // Empty row for spacing
      { "Total Working Days": totalWorkingDays, "Total Hours Spent": totalMonthlyHours.toFixed(2), "Average Daily Hours": avgDailyHours, "Calculated Monthly Salary": `$${monthlySalary}` },
      {}, // Empty row for spacing
      ...formattedData
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${employee.username} Report`);

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${employee.username}_Attendance_Report_${selectedMonth}-${selectedYear}.xlsx`);
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    if (!employee) {
      alert("Please select an employee to export the report.");
      return;
    }

    const doc = new jsPDF();
    doc.text(`Employee Performance Report - ${employee.username}`, 14, 15);
    doc.text(`Month: ${new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`, 14, 22);

    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Working Days', totalWorkingDays],
        ['Total Hours Spent', `${totalMonthlyHours.toFixed(2)} hrs`],
        ['Average Daily Hours', `${avgDailyHours} hrs`],
        ['Calculated Monthly Salary', `$${monthlySalary}`],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [74, 222, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [50, 50, 50] },
    });

    const tableY = doc.autoTable.previous.finalY + 10;
    doc.text('Daily Attendance Details', 14, tableY);

    const dailyTableData = filteredRecords
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(record => [
        record.date,
        formatTime(record.first_check_in),
        formatTime(record.last_check_out),
        record.total_duration_hours ? record.total_duration_hours.toFixed(2) : '0.00',
        record.status
      ]);

    doc.autoTable({
      startY: tableY + 7,
      head: [['Date', 'Check-In', 'Check-Out', 'Hours', 'Status']],
      body: dailyTableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [50, 50, 50] },
    });

    doc.save(`${employee.username}_Performance_Report_${selectedMonth}-${selectedYear}.pdf`);
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>Employee Performance Report</span>
        </h2>
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


      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-8 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="employee-select" className="text-gray-700 font-medium whitespace-nowrap">Select Employee:</label>
          <select
            id="employee-select"
            className="block w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.username}</option>
            ))}
          </select>
        </div>
        {employee && (
          <div className="text-gray-700 text-sm font-medium whitespace-nowrap">
            Report for: <span className="font-semibold text-indigo-600">{employee.username}</span>
            <span className="ml-2">({new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })})</span>
          </div>
        )}
      </div>

      {!employee ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <span className="text-6xl mb-4">👆</span>
          <p className="text-lg font-medium">Please select an employee to view their detailed report.</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <img
              className="h-14 w-14 rounded-full object-cover border-2 border-indigo-400 shadow-md"
              src={employee.avatar}
              alt={employee.username}
              onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/60x60/6366F1/FFFFFF?text=${employee.username.substring(0,2)}` }}
            />
            <div>
              <h3 className="text-xl font-bold text-gray-800">{employee.username}</h3>
              <p className="text-indigo-600 text-sm">Hourly Rate: ${employee.hourlyRate}/hr</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-700 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm flex flex-col items-start justify-center border border-blue-200">
              <p className="text-sm text-gray-600">Total Working Days</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{totalWorkingDays}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm flex flex-col items-start justify-center border border-green-200">
              <p className="text-sm text-gray-600">Total Hours Spent</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{totalMonthlyHours.toFixed(2)} hrs</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm flex flex-col items-start justify-center border border-yellow-200">
              <p className="text-sm text-gray-600">Average Daily Hours</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{avgDailyHours} hrs</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm flex flex-col items-start justify-center border border-purple-200">
              <p className="text-sm text-gray-600">Calculated Monthly Salary</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">${monthlySalary}</p>
            </div>
          </div>

          <h4 className="text-xl font-semibold text-gray-800 mt-8 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Daily Attendance Details
          </h4>
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto max-h-80 custom-scrollbar pr-2">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRecords
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(record => (
                      <tr key={record.attendance_id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatTime(record.first_check_in)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.last_check_out ? formatTime(record.last_check_out) : 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.total_duration_hours ? record.total_duration_hours.toFixed(2) : '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              record.status === "Present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "Absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No detailed attendance records found for this employee and month.</p>
          )}

          {/* Custom Scrollbar CSS */}
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e0; /* gray-300 */
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #a0aec0; /* gray-400 */
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;
