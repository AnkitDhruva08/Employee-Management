import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    employee: '',
    date: '',
    status: ''
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const token = localStorage.getItem("token");

  const attendanceStatusOptions = ['Present', 'Absent', 'Leave'];

  // Smart summary calc
  const generateSummary = (records) => {
    const summaryMap = {};

    records.forEach((record) => {
      const month = new Date(record.date).toLocaleString('default', { month: 'short' });
      if (!summaryMap[month]) {
        summaryMap[month] = { Present: 0, Absent: 0, Leave: 0 };
      }
      summaryMap[month][record.status]++;
    });

    const data = Object.entries(summaryMap).map(([month, counts]) => ({
      month,
      ...counts
    }));
    setSummary(data);
  };

  // Fetch employees and attendance
  useEffect(() => {
    fetch('http://localhost:8000/api/employee/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setEmployees);

    fetch('http://localhost:8000/api/attendance/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAttendanceRecords(data);
        generateSummary(data);
      });
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData({ ...attendanceData, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
      });

      if (response.ok) {
        const newRecord = await response.json();
        const updatedRecords = [...attendanceRecords, newRecord];
        setAttendanceRecords(updatedRecords);
        generateSummary(updatedRecords);
        setAttendanceData({ employee: '', date: '', status: '' });

        Swal.fire('Success', 'Attendance recorded successfully', 'success');
      } else {
        Swal.fire('Error', 'Failed to record attendance', 'error');
      }
    } catch {
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Form */}
        <h3 className="text-2xl font-bold text-blue-700 mb-6">Record Attendance</h3>
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Employee</label>
              <select
                className="w-full border px-4 py-2 rounded-lg"
                name="employee"
                value={attendanceData.employee}
                onChange={handleInputChange}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full border px-4 py-2 rounded-lg"
                name="date"
                value={attendanceData.date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                className="w-full border px-4 py-2 rounded-lg"
                name="status"
                value={attendanceData.status}
                onChange={handleInputChange}
              >
                <option value="">Select Status</option>
                {attendanceStatusOptions.map(status => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Record</button>
        </form>

        {/* Graph */}
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
        <div className="mt-10">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Attendance Records</h3>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border">Employee</th>
                  <th className="p-3 border">Date</th>
                  <th className="p-3 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => {
                  const employee = employees.find(e => e.id === record.employee);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="p-3 border">{employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"}</td>
                      <td className="p-3 border">{record.date}</td>
                      <td className="p-3 border">{record.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
