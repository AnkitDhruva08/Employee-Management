import React from 'react';
import { Link } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';  

const Sidebar = ({ quickLinks }) => {
  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4">
      <ul className="space-y-4 flex-1">
        {/* Dynamic Sidebar Links */}
        {quickLinks.results?.map((link, idx) => {
          const IconComponent = FaIcons[link.icons]; 
          
          return (
            <li key={link.id || idx}>
              <Link 
                to={link.path} 
                className="flex items-center text-lg hover:bg-gray-700 p-2 rounded-md"
              >
                {/* Render the icon if the component exists */}
                {IconComponent && <IconComponent className="mr-3" />}
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
