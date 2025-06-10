import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../components/header/Header";
import CompanyLogo from "../components/CompanyLogo";
import {
  fetchDashboardLink,
  fetchDashboard,
  fetchHolidays,
} from "../utils/api";
import Sidebar from "../components/sidebar/Sidebar";
import Swal from "sweetalert2";

const HoliDays = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState(null);
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

  const HeaderTitle = "Holiday Calendar";

  const fetchAllData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const links = await fetchDashboardLink(token);
      const calender = await fetchHolidays(token);
      const empDashboard = await fetchDashboard(token);

      setHolidays(calender.results);
      setQuickLinks(links.data || links);
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      if (err.response && err.response.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Please log in again.",
        }).then(() => {
          localStorage.removeItem("token");
          sessionStorage.clear();
          navigate("/login");
        });
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token, navigate]);

  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const date = new Date(holiday.date);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date found in holiday data:", holiday.date);
      return acc;
    }
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);

    return acc;
  }, {});

  const handleHolidayFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      const selectedDate = new Date(value);
      const dayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (isEditing) {
        setCurrentHoliday((prev) => ({
          ...prev,
          date: value,
          day_name: dayName,
        }));
      } else {
        setNewHoliday((prev) => ({
          ...prev,
          date: value,
          day_name: dayName,
        }));
      }
    } else {
      if (isEditing) {
        setCurrentHoliday((prev) => ({ ...prev, [name]: value }));
      } else {
        setNewHoliday((prev) => ({ ...prev, [name]: value }));
      }
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

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: "Success!",
          text: "New holiday has been added successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });

        handleCloseModal();
        fetchAllData();
      } else {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : (data.name ? data.name[0] : null) ||
              "Failed to add holiday. Please check the inputs.";

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    } catch (err) {
      console.error("Unexpected error while adding holiday:", err);
      await Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong while connecting to the server.",
      });
    }
  };

  const handleEditClick = (holiday) => {
    setIsEditing(true);
    const formattedDate = holiday.date
      ? new Date(holiday.date).toISOString().split("T")[0]
      : "";
    setCurrentHoliday({ ...holiday, date: formattedDate });
    setShowModal(true);
  };

  const handleUpdateHoliday = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/holidays/${currentHoliday.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(currentHoliday),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: "Success!",
          text: "Holiday has been updated successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });

        handleCloseModal();
        fetchAllData();
      } else {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : (data.name ? data.name[0] : null) ||
              "Failed to update holiday. Please check the inputs.";

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    } catch (err) {
      console.error("Unexpected error while updating holiday:", err);
      await Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong while connecting to the server.",
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentHoliday(null);
    setNewHoliday({
      name: "",
      date: "",
      day_name: "",
    });
  };

  const logoPath = dashboardData?.company_logo;
  const logoUrl = logoPath
    ? `http://localhost:8000/${
        logoPath.startsWith("media/") ? "" : "media/"
      }${logoPath}`
    : null;

  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    let logoBase64 = null;
    try {
      if (logoUrl) {
        logoBase64 = await getBase64ImageFromURL(logoUrl);
        doc.addImage(logoBase64, "PNG", 15, 10, 30, 15);
      }
    } catch (error) {
      console.warn("Logo not added to PDF. Error loading image:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(dashboardData?.company || "Company Name", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Holiday Calendar FY 2025-26", pageWidth / 2, 30, {
      align: "center",
    });

    doc.setDrawColor(0, 123, 255);
    doc.setLineWidth(0.5);
    doc.line(10, 35, pageWidth - 10, 35);

    const rows = holidays.map((holiday, index) => [
      index + 1,
      holiday.name,
      new Date(holiday.date).toLocaleDateString(),
      holiday.day_name,
    ]);

    autoTable(doc, {
      head: [["#", "Holiday Name", "Date", "Day"]],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 5,
        valign: "middle",
      },
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 40, halign: "center" },
        3: { cellWidth: 30, halign: "center" },
      },
      didDrawPage: function (data) {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(
          "Generated on: " + new Date().toLocaleDateString(),
          15,
          pageHeight - 10
        );
        doc.text(`Page ${data.pageNumber}`, pageWidth - 30, pageHeight - 10, {
          align: "right",
        });
      },
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
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-6">
          {dashboardData && (
            <CompanyLogo
              logoPath={dashboardData.company_logo}
            />
          )}
        </div>
        <div className="flex justify-center mb-8">
          <Sidebar quickLinks={quickLinks} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />

        <div className="p-6 overflow-y-auto flex-1">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              {(isCompany || roleId === 1) && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md transition duration-200"
                >
                  Add New Holiday
                </button>
              )}
              <button
                onClick={generatePDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-md transition duration-200"
              >
                Download PDF
              </button>
            </div>

            {Object.keys(holidaysByMonth).length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
                No holidays available.
              </div>
            ) : (
              Object.entries(holidaysByMonth).map(
                ([month, holidaysInMonth], idx) => (
                  <div
                    key={month}
                    className="mb-8 bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h2 className="text-xl font-semibold text-blue-700">
                        {month}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {holidaysInMonth.length} holiday
                        {holidaysInMonth.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-3 border text-left">#</th>
                          <th className="p-3 border text-left">Holiday Name</th>
                          <th className="p-3 border text-left">Date</th>
                          <th className="p-3 border text-left">Day</th>
                          {(isCompany || roleId === 1) && (
                            <th className="p-3 border text-left">Actions</th>
                          )}
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
                            {(isCompany || roleId === 1) && (
                              <td className="p-3 border">
                                <button
                                  onClick={() => handleEditClick(holiday)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs transition duration-200"
                                >
                                  Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-down">
            <h3 className="text-2xl font-bold mb-5 text-gray-800">
              {isEditing ? "Edit Holiday" : "Add New Holiday"}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={isEditing ? currentHoliday.name : newHoliday.name}
                onChange={handleHolidayFormChange}
                placeholder="Holiday Name"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                required
              />
              <input
                type="date"
                name="date"
                value={isEditing ? currentHoliday.date : newHoliday.date}
                onChange={handleHolidayFormChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                required
              />
              <input
                type="text"
                name="day_name"
                value={
                  isEditing ? currentHoliday.day_name : newHoliday.day_name
                }
                disabled
                placeholder="Day (auto-generated)"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end mt-7 space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 text-gray-800 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdateHoliday : handleAddHoliday}
                className={`px-5 py-2 rounded-lg text-white shadow-md transition duration-200 ${
                  isEditing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isEditing ? "Update Holiday" : "Add Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoliDays;
