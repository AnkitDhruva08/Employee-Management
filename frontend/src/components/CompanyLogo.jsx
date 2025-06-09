// components/CompanyLogo.jsx
import React from "react";

const CompanyLogo = ({ logoPath }) => {
  const logoUrl = logoPath
    ? logoPath.startsWith("http")
      ? logoPath
      : `http://localhost:8000/${logoPath.startsWith("media/") ? "" : "media/"}${logoPath}`
    : "https://placehold.co/144x144/cccccc/ffffff?text=Logo";

  return (
    <div className="flex items-center space-x-4 mb-6">
      <img
        src={logoUrl}
        style={{ width: "9rem", height: "9rem" }}
        className="rounded-full object-cover border-4 border-indigo-500 shadow-md"
      />
   
    </div>
  );
};

export default CompanyLogo;
