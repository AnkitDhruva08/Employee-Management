import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars, FaTimes, FaChevronDown, FaSearch, FaSignOutAlt
} from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import { logout } from '../../utils/api';

const Sidebar = ({ quickLinks }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await logout(token);
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredSidebarLinks = (quickLinks.sidebar || []).filter(link =>
    link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (link.submenu && link.submenu.some(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white bg-indigo-700 p-2 rounded-md shadow"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <div
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}
      >
        <div className="flex flex-col h-full space-y-4">

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Navigation Links */}
          <ul className="flex-1 overflow-y-auto space-y-1">
            {filteredSidebarLinks.map((link, idx) => {
              const Icon = FaIcons[link.icons] || FaIcons.FaLink;
              const isActive = location.pathname === link.path;

              return (
                <li key={link.name || idx}>
                  <div
                    onClick={() =>
                      link.submenu ? toggleSubmenu(idx) : navigate(link.path)
                    }
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all
                      ${isActive ? 'bg-indigo-600 font-semibold' : 'hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="text-xl" />
                      <span>{link.name}</span>
                    </div>
                    {link.submenu && (
                      <FaChevronDown
                        className={`transition-transform ${
                          openSubmenu === idx ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>

                  {/* Submenu */}
                  {link.submenu && openSubmenu === idx && (
                    <ul className="ml-6 mt-2 space-y-1 border-l border-gray-700 pl-4">
                      {link.submenu.map((subLink, subIdx) => {
                        const SubIcon = FaIcons[subLink.icons] || FaIcons.FaLink;
                        const isSubActive = location.pathname === subLink.path;

                        return (
                          <li key={subLink.name || subIdx}>
                            <Link
                              to={subLink.path}
                              className={`flex items-center px-3 py-2 rounded-md text-sm transition space-x-2
                                ${isSubActive ? 'bg-indigo-500 font-medium' : 'hover:bg-gray-800'}`}
                              onClick={() => setIsOpen(false)}
                            >
                              <SubIcon className="text-base" />
                              <span>{subLink.name}</span>
                              {subLink.badge && (
                                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-white">
                                  {subLink.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Logout */}
          {/* <div className="pt-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-md hover:bg-red-600 transition"
            >
              <FaSignOutAlt className="mr-3 text-lg" />
              Logout
            </button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
