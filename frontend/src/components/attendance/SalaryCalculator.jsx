import React, { useEffect, useState } from "react";

const XLSX = {
  utils: {
    json_to_sheet: (data) => { console.log("Mock XLSX json_to_sheet", data); return {}; },
    book_new: () => { console.log("Mock XLSX book_new"); return {}; },
    book_append_sheet: (workbook, sheet, name) => { console.log("Mock XLSX book_append_sheet", name); },
  },
  write: (workbook, options) => { console.log("Mock XLSX write", options); return new ArrayBuffer(0); },
};
const saveAs = (blob, filename) => { alert(`File saved as: ${filename}`); console.log("Mock saveAs", filename); };

const jsPDF = function() {
  this.text = (txt, x, y) => console.log(`PDF Text: ${txt} at (${x},${y})`);
  this.autoTable = (options) => console.log("PDF Table options:", options);
  this.save = (filename) => alert(`PDF saved as: ${filename}`);
  this.addPage = () => console.log("PDF Add Page");
  this.setFontSize = (size) => console.log(`PDF Font Size: ${size}`);
  this.setTextColor = (r, g, b) => console.log(`PDF Text Color: ${r},${g},${b}`);
};


const SalaryCalculator = ({ attendanceRecords, employees, selectedMonth, selectedYear }) => {

  const formatTime = (datetime) => {
    return datetime
      ? new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : 'N/A';
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "0.00";

    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const durationMs = outTime - inTime;

    if (durationMs < 0) return "0.00";

    const hours = durationMs / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const calculateSalaries = () => {
    const monthlyHours = {};

    employees.forEach(emp => {
      // Ensure employee has a numeric hourlyRate, default to 0 if not present
      monthlyHours[emp.id] = { totalHours: 0, employee: { ...emp, hourlyRate: emp.hourlyRate || 0 } };
    });

    attendanceRecords.forEach(record => {
      // Filter records for the selected month and year
      const recordDate = new Date(record.date);
      if (recordDate.getMonth() + 1 === selectedMonth && recordDate.getFullYear() === selectedYear) {
        if (monthlyHours[record.employee_id]) { // Use employee_id from attendance record
          monthlyHours[record.employee_id].totalHours += (record.total_duration_hours || 0);
        }
      }
    });

    return Object.values(monthlyHours).map(data => ({
      ...data.employee,
      totalMonthlyHours: parseFloat(data.totalHours.toFixed(2)), // Round to 2 decimal places
      monthlySalary: (data.totalHours * data.employee.hourlyRate).toFixed(2),
    }));
  };

  const calculatedSalaries = calculateSalaries();

  // Handle Export All Salaries to PDF
  const handleExportAllSalariesPDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    doc.setFontSize(16);
    doc.setTextColor(52, 58, 64); // Dark Gray
    doc.text(`Monthly Salary Overview - ${monthName}`, 14, 20);

    const tableData = calculatedSalaries.map(salary => [
      salary.username, // Use username
      `$${salary.hourlyRate}/hr`,
      `${salary.totalMonthlyHours} hrs`,
      `$${salary.monthlySalary}`,
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Employee', 'Hourly Rate', 'Total Hours (Month)', 'Calculated Salary']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' }, // Tailwind purple-700
      bodyStyles: { textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 40 },
      }
    });

    doc.save(`Monthly_Salary_Overview_${selectedMonth}-${selectedYear}.pdf`);
  };

  // Handle Export Individual Salary Slip to PDF
  const handleExportIndividualSalarySlipPDF = (employeeSalaryData) => {
    const doc = new jsPDF();
    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(22);
    doc.setTextColor(74, 222, 128); // Green
    doc.text('Salary Slip', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50); // Darker gray
    doc.text(`For: ${employeeSalaryData.username}`, 14, 30);
    doc.text(`Month: ${monthName}`, 14, 37);

    // Employee & Salary Summary
    doc.setFontSize(14);
    doc.setTextColor(67, 56, 202); // Deeper purple
    doc.text('Summary', 14, 50);
    doc.autoTable({
      startY: 55,
      head: [['Metric', 'Value']],
      body: [
        ['Hourly Rate', `$${employeeSalaryData.hourlyRate}/hr`],
        ['Total Hours Worked', `${employeeSalaryData.totalMonthlyHours} hrs`],
        ['Calculated Gross Salary', `$${employeeSalaryData.monthlySalary}`],
        // You can add more salary components here (e.g., deductions, bonuses)
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [129, 140, 248], textColor: [255, 255, 255], fontStyle: 'bold' }, // Light Indigo
      bodyStyles: { textColor: [50, 50, 50] },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // Daily Attendance Details for the slip
    const employeeDailyRecords = attendanceRecords.filter(record =>
      String(record.employee_id) === String(employeeSalaryData.id) &&
      new Date(record.date).getMonth() + 1 === selectedMonth &&
      new Date(record.date).getFullYear() === selectedYear
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (employeeDailyRecords.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(67, 56, 202);
      doc.text('Daily Attendance Details', 14, doc.autoTable.previous.finalY + 10);

      const dailyTableData = employeeDailyRecords.map(record => [
        record.date,
        formatTime(record.first_check_in),
        record.last_check_out ? formatTime(record.last_check_out) : 'N/A',
        record.total_duration_hours ? record.total_duration_hours.toFixed(2) : '0.00',
        record.status
      ]);

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [['Date', 'Check-In', 'Check-Out', 'Hours', 'Status']],
        body: dailyTableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' }, // Blue
        bodyStyles: { textColor: [50, 50, 50] },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No detailed attendance records found for this month.', 14, doc.autoTable.previous.finalY + 15);
    }

    doc.save(`${employeeSalaryData.username}_Salary_Slip_${selectedMonth}-${selectedYear}.pdf`);
  };

  // Display message if no salary data is available
  if (calculatedSalaries.length === 0 || calculatedSalaries.every(s => s.totalMonthlyHours === 0)) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8 flex flex-col items-center justify-center h-full text-gray-400 py-16">
        <span className="text-6xl mb-4">💰</span>
        <p className="text-lg font-medium">No salary data available for this month.</p>
        <p className="text-sm">Ensure attendance records exist and are filtered for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>Monthly Salary Overview</span>
        </h2>
        <button
          onClick={handleExportAllSalariesPDF}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2m7 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z" />
          </svg>
          Export All Salaries (PDF)
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4 text-left font-medium rounded-tl-lg">
                Employee
              </th>
              <th scope="col" className="px-6 py-4 text-left font-medium">
                Hourly Rate
              </th>
              <th scope="col" className="px-6 py-4 text-left font-medium">
                Total Hours (Month)
              </th>
              <th scope="col" className="px-6 py-4 text-left font-medium">
                Calculated Salary
              </th>
              <th scope="col" className="px-6 py-4 text-center font-medium rounded-tr-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {calculatedSalaries.map(salary => (
              <tr key={salary.id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200"
                      src={salary.avatar || `https://placehold.co/40x40/6366F1/FFFFFF?text=${salary.username?.substring(0,2)}`}
                      alt={salary.username}
                    />
                    <div className="text-base font-medium text-gray-800">{salary.username}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${salary.hourlyRate}/hr</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {salary.totalMonthlyHours} hrs
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-600">${salary.monthlySalary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleExportIndividualSalarySlipPDF(salary)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Slip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryCalculator;
