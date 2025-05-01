import React, { useState } from "react";

const AttendanceModule = () => {
    const [attendanceData, setAttendanceData] = useState([
        { id: 1, name: "John Doe", status: "Present" },
        { id: 2, name: "Jane Smith", status: "Absent" },
        { id: 3, name: "Alice Johnson", status: "Present" },
    ]);

    const handleStatusChange = (id, newStatus) => {
        setAttendanceData((prevData) =>
            prevData.map((record) =>
                record.id === id ? { ...record, status: newStatus } : record
            )
        );
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Attendance Dashboard</h1>
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #ddd", padding: "8px" }}>ID</th>
                        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
                        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
                        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {attendanceData.map((record) => (
                        <tr key={record.id}>
                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                {record.id}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                {record.name}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                {record.status}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                <button
                                    onClick={() => handleStatusChange(record.id, "Present")}
                                    style={{
                                        marginRight: "10px",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Mark Present
                                </button>
                                <button
                                    onClick={() => handleStatusChange(record.id, "Absent")}
                                    style={{ padding: "5px 10px", cursor: "pointer" }}
                                >
                                    Mark Absent
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceModule;