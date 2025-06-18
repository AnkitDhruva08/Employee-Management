
import React, { useEffect, useState } from "react";

import CompanyLogo from "../CompanyLogo";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
const AttendanceTracker = ({ attendanceRecords, getEmployeeById }) => {

    console.log('attendanceRecords ==<<>>', attendanceRecords)
  const handleExportExcel = () => {
    const formattedData = attendanceRecords.map((record, index) => ({
      "Sr No.": index + 1,
      Employee: record.user_name || "",
      Date: record.date || "",
      "Check-In": record.checkIn || "",
      "Check-Out": record.checkOut || "",
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
      record.checkIn,
      record.checkOut,
      `${record.totalHours} hrs`,
      record.status,
    ]);

    doc.autoTable({
      head: [["#", "Employee", "Date", "Check-In", "Check-Out", "Hours", "Status"]],
      body: tableData,
    });
    doc.save("Attendance.pdf");
  };

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
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export to Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2m7 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z"></path></svg>
          Export to PDF
        </button>
      </div>
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
                          src={employee?.avatar || `https://placehold.co/40x40/6366F1/FFFFFF?text=${record.user_name?.substring(0,2)}`}
                          alt={record.user_name}
                        />
                        <div className="text-sm font-medium text-gray-100">{record.user_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
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


export default AttendanceTracker;