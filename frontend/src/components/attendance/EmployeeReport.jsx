
import React, { useEffect, useState } from "react";

import CompanyLogo from "../CompanyLogo";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const EmployeeReport = ({ employees, attendanceRecords, selectedMonth, selectedYear }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id); 
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

export default EmployeeReport;