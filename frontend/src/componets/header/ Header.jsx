import React, { useEffect, useState } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!userData) return <div className="text-center">Loading...</div>;

  const role = userData?.role;
  const isCompany = userData.is_company;

  const displayName = isCompany
    ? userData?.company || "Company"
    : userData?.employee_details?.[0]?.first_name || "User";

  const email = userData?.email || "example@example.com";
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-gray-800">Dashboard</div>

      <div className="relative flex items-center gap-4 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
        {/* User Info */}
        <div className="text-right">
          <h4 className="font-semibold text-gray-800">{displayName}</h4>
          <p className="text-sm text-gray-500">{email}</p>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg">
          {firstLetter}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-14 w-64 bg-white shadow-md rounded-md p-4 z-50">
            <h4 className="font-semibold text-gray-800 mb-1">{displayName}</h4>
            <p className="text-sm text-gray-500 mb-4">{email}</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
