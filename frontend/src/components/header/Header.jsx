import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  logout,
  fetchUnreadNotifications,
  fetchDashboardDetails,
} from "../../utils/api";
import {
  LogOut,
  User,
  Settings,
  CreditCard,
  Bell,
} from "lucide-react";

const Header = ({ title }) => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifError, setNotifError] = useState(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEffects = async () => {
      try {
        const notifyData= await fetchUnreadNotifications(token);
        const dashData = await fetchDashboardDetails(token);
        setUserData(dashData);
        setNotifications(notifyData);
      } catch (err) {
        console.error("Fetch failed:", err.message);
        setNotifError("Couldn't load notifications");
        setError("Failed to load user info");
      }
    };

    fetchEffects();
  }, [token]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout(token);
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!userData) return <div className="text-center">Loading...</div>;

  const role = userData?.role;
  const isCompany = userData?.is_company;
  const isSuperUser = userData?.is_superuser;
  const displayName = isSuperUser
  ? "Superuser"
  : userData?.role_id === 1
  ? userData?.admin_name || "Admin"
  : userData?.role_id === 2
  ? userData?.hr_name || "HR"
  : isCompany
  ? userData?.company
  : userData?.employee_details?.[0]?.first_name || "User";

const email = userData?.email || "example@example.com";
const firstLetter = displayName?.charAt(0)?.toUpperCase();


  const profileImagePath = userData?.is_company
    ? userData?.company_logo
    : userData?.role_id === 1
    ? userData?.admin_profile
    : userData?.role_id === 2
    ? userData?.hr_profile
    : userData?.employee_details?.[0]?.profile_image;

  const profileImageUrl = profileImagePath
    ? `http://localhost:8000/media/${profileImagePath}`
    : null;

  return (
    <div className="w-full bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-gray-800">{title}</div>

      <div className="flex items-center gap-6 cursor-pointer">
        {/* 🔔 Notification */}
        <div className="relative" ref={notifRef}>
          <Bell
            className="w-6 h-6 text-gray-600 hover:text-blue-600"
            onClick={() => setShowNotifications((prev) => !prev)}
          />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
              {notifications.length}
            </span>
          )}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl z-50 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Notifications
              </h4>
              {notifError ? (
                <p className="text-sm text-red-500">{notifError}</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {notifications.map((notif) => (
                  <li key={notif.id} className="py-2 text-sm text-gray-600 hover:text-blue-600">
                    <Link to={`/notification/${notif.id}`} className="block w-full">
                      {notif.message}
                    </Link>
                  </li>
                  ))}
                </ul>
              )}
              <div className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                <Link to="/notifications">View all</Link>
              </div>
            </div>
          )}
        </div>

        {/* 👤 User Dropdown */}
        <div
          className="flex items-center gap-3"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <div className="text-right hidden sm:block">
            <h4 className="font-semibold text-gray-800">
              {role} || {displayName}
            </h4>
            <p className="text-sm text-gray-500">{email}</p>
          </div>

          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg">
              {firstLetter}
            </div>
          )}
        </div>

        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl z-50 p-4">
              <div className="flex items-center space-x-3 mb-4">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg">
                    {firstLetter}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500">{email}</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-sm">
                <div className="space-y-1 pb-3">
                  <DropdownItem icon={<User />} label="View Profile" path="/profile-page" />
                  <DropdownItem icon={<Settings />} label="Settings" />
                </div>

                <div className="space-y-1 py-3">
                  <DropdownItem icon={<CreditCard />} label="Home" path="/dashboard" />
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </span>
                    <span className="text-xs text-gray-400">⌘ Q</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DropdownItem = ({ icon, label, path }) => {
  return (
    <Link
      to={path || "#"}
      className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
    >
      <span className="flex items-center gap-2">
        {icon} {label}
      </span>
    </Link>
  );
};

export default Header;
