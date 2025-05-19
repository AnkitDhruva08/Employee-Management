import React from "react";
import { FaTachometerAlt, FaProjectDiagram, FaBug, FaHistory, FaTasks } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const sidebarLinks = [
  { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
  { name: "Projects", icon: <FaProjectDiagram />, path: "/projects" },
  { name: "Bugs & Testing", icon: <FaBug />, path: "/bugs" },
  { name: "Retrospective", icon: <FaHistory />, path: "/retrospective" },
  { name: "Employee Task Today", icon: <FaTasks />, path: "/employee-task" },
];

const ProjectSidebar = () => {
  return (
    <nav className="flex flex-col space-y-4">
      {sidebarLinks.map((link, index) => (
        <NavLink
          key={index}
          to={link.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
              isActive
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          <span className="text-lg">{link.icon}</span>
          <span className="text-sm font-medium">{link.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default ProjectSidebar;
