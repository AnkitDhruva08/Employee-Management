import React, { useState } from 'react';
import FileUpload from "../File/FileUpload";

export default function UploadImageModal({ isOpen, onClose, onUploadSuccess, uploadFor }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formDataState, setFormDataState] = useState({
    profileImage: null
  });

  const handleFileChange = (files) => {
    setFormDataState({
      profileImage: files.length > 0 ? files[0] : null,
    });
    setError(null);
  };

  const handleUpload = async () => {
    if (!formDataState.profileImage || !(formDataState.profileImage instanceof File)) {
      setError("Please select a valid image file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const apiFormData = new FormData();
    // apiFormData.append('image', formDataState.profileImage.file);
    apiFormData.append('image', formDataState.profileImage);

    const token = localStorage.getItem('token');
    console.log('Token:', token);

    let uploadUrl = '';

    if (uploadFor === 'employee') {
      uploadUrl = 'http://localhost:8000/api/upload-profile-picture/';
    } else if (uploadFor === 'company') {
      uploadUrl = 'http://localhost:8000/api/upload-company-logo/';
    } else {
      setError("Invalid upload target.");
      setUploading(false);
      return;
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: apiFormData,
      });

      const responseData = await response.json();
      console.log('Response Data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || 'Upload failed.');
      }

      console.log('Upload success:', responseData);
      setSuccessMessage(`${uploadFor === 'employee' ? 'Profile picture' : 'Company logo'} uploaded successfully!`);

      setFormDataState({ profileImage: null });

      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {uploadFor === "employee"
            ? "Upload Profile Picture"
            : "Upload Company Logo"}
        </h2>

        <div className="mb-2 rounded-lg">
          <FileUpload
            isView={false}
            isCombine={false}
            initialFiles={formDataState.profileImage ? [formDataState.profileImage] : []}
            onFilesSelected={handleFileChange}
          />
        </div>

        {formDataState.profileImage && (
          <p className="text-sm text-gray-600 mb-2 mt-2">
            Selected: {formDataState.profileImage.name || formDataState.profileImage.file?.name}
          </p>
        )}

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 mb-2">{successMessage}</p>}

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
           
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}