import React from "react";
import { FaClipboardList, FaTasks, FaSpinner, FaCheckCircle, FaClipboardCheck, FaUserFriends, FaRegCalendarAlt, FaCog, FaTachometerAlt } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const sidebarLinks = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
    { name: "My Tasks", icon: <FaClipboardList />, path: "/tasks" },
    { name: "To Do", icon: <FaTasks />, path: "/tasks/todo" },
    { name: "In Progress", icon: <FaSpinner />, path: "/tasks/in-progress" },
    { name: "In Review", icon: <FaClipboardCheck />, path: "/tasks/in-review" },
    { name: "Done", icon: <FaCheckCircle />, path: "/tasks/done" },
    { name: "Team Overview", icon: <FaUserFriends />, path: "/team" },
    { name: "Calendar", icon: <FaRegCalendarAlt />, path: "/calendar" },
    { name: "Settings", icon: <FaCog />, path: "/settings" },
  ];

const TaskSidebar = () => {
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

export default TaskSidebar;
