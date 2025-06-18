
import React, { useEffect, useState } from "react";

import CompanyLogo from "../CompanyLogo";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";


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


export default SalaryCalculator;