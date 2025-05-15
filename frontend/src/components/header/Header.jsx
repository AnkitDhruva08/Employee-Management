import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../../utils/api";
import {
  ChevronDown,
  LogOut,
  User,
  Settings,
  CreditCard,
  FileText,
  Users,
  UserPlus,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

// import UploadImageModal from "../File/UploadProfileImage";

const Header = ({ title }) => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  


  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/dashboard/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        setError("Failed to load user info");
      }
    };

    fetchUserDetails();
  }, []);

  // 🔹 Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
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
  const displayName = isSuperUser ? "Superuser": userData.role_id === 1
    ? `${userData?.admin_name || "Admin"}`
    : isCompany
      ? userData?.company
      : userData?.employee_details?.[0]?.first_name || "User";
  const email = userData?.email || "example@example.com";
  const firstLetter = displayName.charAt(0).toUpperCase();

  // Construct the profile image URL by appending the relative path to the base URL for media
  const profileImagePath = userData?.is_company? userData?.company_logo : userData?.role_id === 1
 ? userData?.admin_profile : userData?.role_id === 2
 ? userData?.hr_profile: userData?.employee_details?.[0]?.profile_image;


  const profileImageUrl = profileImagePath
    ? `http://localhost:8000/media/${profileImagePath}`
    : null;

  return (
    <div className="w-full bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-gray-800">{title}</div>

      <div className="relative">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="text-right hidden sm:block">
            <h4 className="font-semibold text-gray-800">
              {role} || {displayName}
            </h4>
            <p className="text-sm text-gray-500">{email}</p>
          </div>

          {/* Conditional rendering of profile image or initial */}
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg">
              A
            </div>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          ></div>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl z-50 p-4">
              <div className="flex items-center space-x-3 mb-4">
                {/* Profile Image here as well */}
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
                  <DropdownItem
                    icon={<User />}
                    label="View Profile"
                    path="/profile-page"
                  />
                  {/* <div
                    onClick={() => setShowImageModal(true)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User /> Update Profile
                    </span>
                  </div> */}
                  <DropdownItem
                    icon={<Settings />}
                    label="Settings"
                    shortcut="⌘ G"
                    active
                  />
                </div>

                <div className="space-y-1 py-3">
                  <DropdownItem
                    icon={<CreditCard />}
                    label="Home"
                    path="/dashboard"
                  />
                  {/* <DropdownItem icon={<FileText />} label="Changelog" shortcut="⌘ E" />
                <DropdownItem icon={<Users />} label="Team" shortcut="⌘ T" /> */}
                </div>

                <div className="space-y-1 py-3">
                  {/* <DropdownItem icon={<UserPlus />} label="Invite Member" shortcut="⌘ F" />
                <DropdownItem icon={<HelpCircle />} label="Support" shortcut="⌘ R" />
                <DropdownItem icon={<MessageCircle />} label="Community" shortcut="⌘ U" /> */}
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
      to={path}
      className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
    >
      <span className="flex items-center gap-2">
        {icon} {label}
      </span>
    </Link>
  );
};

export default Header;
