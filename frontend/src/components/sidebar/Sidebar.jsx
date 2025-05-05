import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import { logout } from '../../utils/api';

const Sidebar = ({ quickLinks }) => {
  const navigate = useNavigate();

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
  

  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4 flex flex-col justify-between">
      <ul className="space-y-4">
        {/* Dynamic Sidebar Links */}
        {quickLinks.dashboard_links?.map((link, idx) => {
          const IconComponent = FaIcons[link.icons];

          return (
            <li key={link.id || idx}>
              <Link 
                to={link.path} 
                className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md"
              >
                {IconComponent && <IconComponent className="mr-3" />}
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout Button at Bottom */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center text-lg bg-red-600 hover:bg-red-700 p-2 rounded-md"
      >
        <FaIcons.FaSignOutAlt className="mr-3" />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
