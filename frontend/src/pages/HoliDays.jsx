import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../components/header/Header";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchHolidays,
} from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import logo from "../assets/Logo.png";
import Swal from "sweetalert2";
const HoliDays = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    day_name: "",
  });
  const [holidays, setHolidays] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  console.log('isCompany ===<<<>>>', isCompany)
  
  let HeaderTitle = "Holiday Calendar";

  //    For Fetching the Dashboard
  const fetchLinks = async () => {
    try {
      const links = await fetchDashboardLink(token);
      const calender = await fetchHolidays(token);
      const empDashboard = await fetchDashboard(token);
      setHolidays(calender.results);
      setQuickLinks(links.data || links);
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching quick links:", err);
      setError("Failed to load quick links");
      localStorage.removeItem("token");
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchLinks();
  }, []);

  //   holidays by month
  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const date = new Date(holiday.date);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);

    return acc;
  }, {});

  //    function to Add New Holiday
  const handleNewHolidayChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      const selectedDate = new Date(value);
      const dayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      setNewHoliday((prev) => ({
        ...prev,
        date: value,
        day_name: dayName, 
      }));
    } else {
      setNewHoliday((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddHoliday = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/holidays/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newHoliday),
      });

      if (response.ok) {
        await Swal.fire({
          title: "Success!",
          text: "New holiday has been added.",
          icon: "success",
          confirmButtonText: "OK",
        });

        setShowModal(false);
        setNewHoliday({ name: "", date: "", day_name: "" });

        fetchLinks();
      } else {
        throw new Error("Failed to add holiday");
      }
    } catch (err) {
      console.error("Error adding holiday:", err);
      Swal.fire("Error", "Failed to add holiday", "error");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Holiday Calendar FY 2025-26", 14, 15);

    const rows = holidays.map((holiday, index) => [
      index + 1,
      holiday.name,
      new Date(holiday.date).toLocaleDateString(),
      holiday.day_name,
    ]);

    autoTable(doc, {
      head: [["#", "Holiday Name", "Date", "Day"]],
      body: rows,
      startY: 20,
    });

    doc.save("Holiday-Calendar-FY2025-26.pdf");
  };

  if (error) {
    return (
      <div className="text-red-600 text-center mt-10 text-xl animate-pulse">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center mt-10 text-xl text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
          </div>
          <h2 className="text-lg font-semibold">{dashboardData.company}</h2>
        </div>

        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        {/* Stats Cards */}

        <div className="p-6 overflow-y-auto flex-1">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
            {(isCompany || roleId === 1) && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New Holiday
            </button>
          )}
            <button
                onClick={generatePDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Download PDF
              </button>
            </div>

            {Object.entries(holidaysByMonth).map(
              ([month, holidaysInMonth], idx) => (
                <div
                  key={month}
                  className="mb-8 bg-white rounded-xl shadow-md p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-blue-700">
                      {month}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {holidaysInMonth.length} holiday
                      {holidaysInMonth.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="p-3 border text-left">#</th>
                        <th className="p-3 border text-left">Holiday Name</th>
                        <th className="p-3 border text-left">Date</th>
                        <th className="p-3 border text-left">Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidaysInMonth.map((holiday, index) => (
                        <tr key={holiday.id} className="hover:bg-gray-50">
                          <td className="p-3 border">{index + 1}</td>
                          <td className="p-3 border">{holiday.name}</td>
                          <td className="p-3 border">
                            {new Date(holiday.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 border">{holiday.day_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Add New Holiday
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={newHoliday.name}
                onChange={handleNewHolidayChange}
                placeholder="Holiday Name"
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring"
              />
              <input
                type="date"
                name="date"
                value={newHoliday.date}
                onChange={handleNewHolidayChange}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring"
              />
              <select
                name="day_name"
                value={newHoliday.day_name}
                disabled
                onChange={handleNewHolidayChange}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring"
              >
                <option value="">Select Day</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHoliday}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoliDays;
