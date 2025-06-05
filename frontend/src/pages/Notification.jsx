import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  fetchNotificationById,
  fetchDashboardLink,
  fetchDashboard,
} from "../utils/api";
import { Bell, Loader2 } from "lucide-react";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";

const Notification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationDetail, setNotificationDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";

  const HeaderTitle = isSuperUser
    ? "Superuser Notification Dashboard"
    : isCompany
    ? "Company Notification Dashboard"
    : roleId === 3
    ? "Employee Notification Dashboard"
    : roleId === 2
    ? "HR Notification Dashboard"
    : roleId === 1
    ? "Admin Notification Dashboard"
    : "Notification Dashboard";

    useEffect(() => {
      const fetchLinks = async () => {
        try {
          if (!isSuperUser) {
            const links = await fetchDashboardLink(token);
            setQuickLinks(links.data || links);
          }
          const empDashboard = await fetchDashboard(token);
          setDashboardData(empDashboard);
        } catch (err) {
          console.error("Error fetching dashboard:", err);
          localStorage.removeItem("token");
          sessionStorage.clear();
          navigate("/login");
        }
      };
    
      const loadNotifications = async () => {
        setLoading(true);
        setError(null);
    
        try {
          if (id) {
            const detail = await fetchNotificationById(token, id);
            setNotificationDetail(detail);
    
            await fetch(
              `http://localhost:8000/api/notifications/${id}/mark-read/`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
    
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === parseInt(id) ? { ...n, is_read: true } : n
              )
            );
          } else {
            const data = await fetchNotifications(token);
            setNotifications(data);
          }
        } catch (err) {
          console.error("Error loading notifications:", err);
          setError("Failed to load notifications.");
        } finally {
          setLoading(false);
        }
      };
    
      loadNotifications();
      fetchLinks();
    }, [id, token, isSuperUser, navigate]);
    

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {!isSuperUser && (
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            {dashboardData?.company || "Loading..."}
          </h2>
          <Sidebar quickLinks={quickLinks} />
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Header title={HeaderTitle} />
        <div className="p-6 overflow-y-auto flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            {id ? "Notification Detail" : "Your Notifications"}
          </h1>

          {id ? (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <p className="text-lg text-gray-800 mb-2 leading-relaxed">
                {notificationDetail?.message?.includes("'") ? (
                  <>
                    {notificationDetail.message.split("'")[0]}
                    <Link
                      to={notificationDetail.url || "#"}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {notificationDetail.message.split("'")[1]}
                    </Link>
                    {notificationDetail.message.split("'")[2]}
                  </>
                ) : (
                  notificationDetail?.message
                )}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                {new Date(notificationDetail?.timestamp).toLocaleString()}
              </p>

              <Link
                to="/notifications"
                className="mt-6 inline-block text-blue-600 hover:underline text-sm"
              >
                ← Back to all notifications
              </Link>
            </div>
          ) : (
            <ul className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              {notifications.length === 0 && (
                <p className="text-gray-600">No notifications yet.</p>
              )}
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`transition duration-150 border rounded-lg p-4 ${
                    notif.is_read
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200 shadow-sm"
                  } hover:scale-[1.01] hover:shadow-md cursor-pointer`}
                >
                  <button
                    onClick={async () => {
                      try {
                        await fetch(
                          `http://localhost:8000/api/notifications/${notif.id}/mark-read/`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notif.id ? { ...n, is_read: true } : n
                          )
                        );

                        navigate(notif.url || `/notifications/${notif.id}`);
                      } catch (error) {
                        console.error(
                          "Failed to mark as read and navigate",
                          error
                        );
                      }
                    }}
                    className="block w-full text-left"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`font-medium text-sm ${
                          notif.is_read ? "text-gray-800" : "text-blue-700"
                        }`}
                      >
                        {notif.message}
                      </span>
                      {!notif.is_read && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notification;
