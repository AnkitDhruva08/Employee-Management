import React from 'react';
import { Link } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';  

const EmployeeSidebar = ({ quickLinks }) => {
  console.log('quickLinks:', quickLinks);

  const renderIcon = (iconName) => {
    const IconComponent = FaIcons[iconName];
    return IconComponent ? <IconComponent className="mr-3" /> : <FaIcons.FaQuestionCircle className="mr-3" />;
  };

  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4">
      <ul className="space-y-4 flex-1">
        {/* Dynamic Sidebar Links */}
        {quickLinks?.map((link, idx) => {
          return (
            <li key={link.id || idx}>
              <Link 
                to={link.path} 
                className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md"
              >
                {/* Render the icon if the component exists */}
                {renderIcon(link.icons)}
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EmployeeSidebar;

