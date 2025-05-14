import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import { FaBars, FaTimes, FaBuilding } from 'react-icons/fa';
import { logout } from '../../utils/api';

const Sidebar = ({ quickLinks }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

  const isSuperuser = quickLinks?.is_superuser;

  return (
    <>
      {/* Hamburger Icon */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white bg-gray-800 p-2 rounded-md"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}
      >
        <div className="flex flex-col justify-between h-full">
          <ul className="space-y-4">
            {quickLinks.dashboard_links?.map((link, idx) => {
              const IconComponent = FaIcons[link.icons] || FaIcons.FaLink;

              return (
                <li key={link.id || idx}>
                  <Link
                    to={link.path}
                    className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {IconComponent && <IconComponent className="mr-3" />}
                    {link.name}
                  </Link>
                </li>
              );
            })}

            {/* Superuser Specific Links */}
            {isSuperuser && (
              <>
                <li className="mt-4 font-semibold text-sm text-gray-400 uppercase">
                  Admin Tools
                </li>
                <li>
                  <Link
                    to="/admin/companies"
                    className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaBuilding className="mr-3" />
                    All Companies
                  </Link>
                </li>
              </>
            )}
          </ul>

        </div>
      </div>
    </>
  );
};

export default Sidebar;
