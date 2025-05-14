import React, { useState } from 'react';
const DocumentViewer = ({ label, url }) => {
    const fileExtension = url?.split('.').pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension);
    const isPDF = fileExtension === "pdf";
  
    return (
      <div className="w-full px-2 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        
        <div className="border rounded-md p-4 bg-gray-50 shadow-sm flex items-center gap-4">
          {isImage ? (
            <img
              src={url}
              alt={label}
              className="max-w-[200px] max-h-[200px] rounded shadow object-contain"
            />
          ) : isPDF ? (
            <iframe
              src={url}
              title={label}
              className="w-full h-64 rounded border"
            />
          ) : (
            <div className="text-gray-600">Unsupported format: <strong>{fileExtension}</strong></div>
          )}
  
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Download
          </a>
        </div>
      </div>
    );
  };
  


  export default DocumentViewer;
