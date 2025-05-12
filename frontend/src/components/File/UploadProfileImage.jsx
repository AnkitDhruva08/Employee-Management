import { useState, useEffect } from "react";
import FileUpload from "../File/FileUpload";
import { fetchUserProfile } from "../../utils/api";
import { FaTrash, FaEye } from "react-icons/fa";
import { FiEye } from "react-icons/fi";

export default function UploadImageModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [existingImage, setExistingImage] = useState(null);
  const token = localStorage.getItem("token");
  const [showActions, setShowActions] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await fetchUserProfile(token);
        if (profileData.employee?.profile_image) {
          const imageUrl = `http://localhost:8000${profileData.employee.profile_image}`;
          setExistingImage({
            name: "profile_image.jpeg",
            url: imageUrl,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile image", err);
      }
    };

    if (isOpen) fetchProfile();
  }, [isOpen, token]);

  const handleUpload = async () => {
    if (!selectedFile?.file) return;

    const formData = new FormData();
    formData.append("profile_image", selectedFile.file);

    try {
      setUploading(true);
      const res = await fetch("http://localhost:8000/api/upload-profile-picture/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = (url) => {
    if (url) window.open(url, "_blank");
    else alert("No file available to view.");
  };

  const handleDelete = () => {
    setSelectedFile(null);
    setExistingImage(null);
  };

  const filesToShow = selectedFile
    ? [{ name: selectedFile.file.name, url: selectedFile.url }]
    : existingImage
    ? [existingImage]
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-black text-xl"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Preview Files</h2>

        {filesToShow.length > 0 && (
         <table className="w-full mb-4 text-sm border border-gray-200">
         <thead className="bg-gray-100">
           <tr>
             <th className="p-2 border">Sr.No</th>
             <th className="p-2 border">Filename</th>
             <th className="p-2 border">Action</th>
           </tr>
         </thead>
         <tbody>
           {filesToShow.map((file, index) => (
             <tr key={index}>
               <td className="p-2 border text-center">{index + 1}</td>
               <td className="p-2 border">{file.name}</td>
               <td className="p-2 border text-center">
                 <div className="relative inline-block">
                   <button
                     onClick={() => setShowActions((prev) => !prev)}
                     className="text-gray-700 hover:text-black"
                     title="Toggle Actions"
                   >
                     <FiEye />
                   </button>
                   {showActions && (
                     <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white border rounded shadow p-2 flex gap-3 z-10">
                       <button
                         onClick={() => handleViewFile(file.url)}
                         className="text-blue-600 hover:text-blue-800"
                         title="View File"
                       >
                         <FaEye />
                       </button>
                       <button
                         onClick={handleDelete}
                         className="text-red-600 hover:text-red-800"
                         title="Delete File"
                       >
                         <FaTrash />
                       </button>
                     </div>
                   )}
                 </div>
               </td>
             </tr>
           ))}
         </tbody>
       </table>
        )}

        <FileUpload
          isView={false}
          isCombine={false}
          onFilesSelected={(files) => {
            const file = files[0];
            setSelectedFile(file);
            setExistingImage(null);
          }}
          onDeletedFiles={handleDelete}
        />

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
