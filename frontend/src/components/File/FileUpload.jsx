import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import DeleteIcon from "../icons/DeleteIcon";
import EyeIcon from "../icons/EyeIcon";
import PreviewIcon from "../icons/PreviewIcon";

const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg", "application/pdf"];

const FileUpload = ({
  isView = false,
  isCombine = false,
  onFilesSelected,
  onDeletedFiles,
  onPreviewFile,
  initialFiles = [],
  accept = ".jpg,.jpeg,.png,.pdf",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) return;

    const mappedFiles = initialFiles.map((file) => {
      if (typeof file === "string") {
        const fullUrl = file.startsWith("http")
          ? file
          : `http://localhost:8000${file}`;
        return {
          id: uuidv4(),
          name: file.split("/").pop(),
          url: fullUrl,
          file: null,
          isRemote: true,
        };
      } else {
        return {
          id: uuidv4(),
          name: file.name,
          url: URL.createObjectURL(file),
          file,
          isRemote: false,
        };
      }
    });

    setFiles((currentFiles) =>
      currentFiles.length === 0 ? mappedFiles : currentFiles
    );

    return () => {
      mappedFiles.forEach((f) => {
        if (!f.isRemote && f.url) {
          URL.revokeObjectURL(f.url);
        }
      });
    };
  }, [initialFiles]);

  const validateFileTypes = (fileList) => {
    const validFiles = fileList.filter((file) =>
      allowedFileTypes.includes(file.type)
    );
    const isValid = validFiles.length === fileList.length;
    const error = isValid
      ? ""
      : "Only PNG, JPG, JPEG, and PDF files are allowed.";
    return { isValid, validFiles, error };
  };

  const handleFileUpload = (e) => {
    const fileList = Array.from(e.target.files || []);
    const { isValid, validFiles, error } = validateFileTypes(fileList);

    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: error,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    files.forEach((f) => {
      if (!f.isRemote && f.url) {
        URL.revokeObjectURL(f.url);
      }
    });

    const mappedFiles = validFiles.map((file) => ({
      id: uuidv4(),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      isRemote: false,
    }));

    setFiles(mappedFiles);

    if (isCombine) {
      onFilesSelected?.([...files.filter((f) => f.isRemote), ...mappedFiles]);
    } else {
      onFilesSelected?.(validFiles);
    }
  };

  const previewFileList = () => {
    setIsOpen(true);
  };

  const previewParticularFile = (fileToPreview) => {
    if (fileToPreview && fileToPreview.url) {
      window.open(fileToPreview.url, "_blank");
    } else {
      console.warn("No URL available for preview.");
    }
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    const deletedFile = files.find((f) => f.id === id);
    const updatedFiles = files.filter((f) => f.id !== id);

    if (deletedFile && !deletedFile.isRemote && deletedFile.url) {
      URL.revokeObjectURL(deletedFile.url);
    }

    setFiles(updatedFiles);

    if (onDeletedFiles) {
      const originalFileObjects = updatedFiles
        .filter((f) => !f.isRemote)
        .map((f) => f.file);

      if (originalFileObjects.length === 0 && deletedFile?.isRemote) {
        onDeletedFiles(null);
      } else {
        onDeletedFiles(originalFileObjects);
      }
    }
  };

  const downloadFile = async (file) => {
    if (file.isRemote) {
      try {
        const response = await fetch(file.url, { mode: "cors" });
        if (!response.ok) throw new Error("Network response was not ok");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = file.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download file.");
      }
    } else if (file.file) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.warn("Cannot download this file");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!isView ? (
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-red-300 rounded hover:bg-red-50 transition">
            <PreviewIcon width={24} height={24} fill="#D2232A" />
            <span className="font-semibold text-red-600">Upload</span>
            <input
              type="file"
              className="hidden"
              multiple={isCombine}
              accept={accept}
              onChange={handleFileUpload}
            />
          </label>

          {files.length > 0 && (
            <button
              onClick={previewFileList}
              className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
              title="Preview Files"
            >
              <EyeIcon width={24} height={24} fill="#4B5563" />
            </button>
          )}
        </div>
      ) : (
        files.length > 0 && (
          <button
            onClick={previewFileList}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            <EyeIcon width={20} height={20} fill="#fff" />
            View Files
          </button>
        )
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">
                {isView ? "View Files" : "Manage Files"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Sr.No</th>
                    <th className="p-2 border">Filename</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.length > 0 ? (
                    files.map((file, index) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="p-2 border">{index + 1}</td>
                        <td className="p-2 border">{file.name}</td>
                        <td className="p-2 border flex gap-2">
                          {!isView && (
                            <button
                              onClick={() => handleDelete(file.id)}
                              title="Delete"
                            >
                              <DeleteIcon
                                width={20}
                                height={20}
                                fill="#D2232A"
                              />
                            </button>
                          )}
                          <button
                            onClick={() => previewParticularFile(file)}
                            title="Preview"
                          >
                            <EyeIcon width={20} height={20} fill="#4B5563" />
                          </button>
                          <button
                            onClick={() => downloadFile(file)}
                            title="Download"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ⬇️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-gray-500">
                        No Files Found!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
