import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '../icons/DeleteIcon';
import EyeIcon from '../icons/EyeIcon';
import PreviewIcon from '../icons/PreviewIcon';

const FileUpload = ({
  isView = false,
  isCombine = false,
  onFilesSelected,
  onDeletedFiles,
  onPreviewFile,
  initialFiles = [], 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [files, setFiles] = useState(() =>
    initialFiles.map((file, index) => ({
      id: uuidv4(),
      name: typeof file === 'string' ? file.split('/').pop() : file.name,
      url: typeof file === 'string' ? file : URL.createObjectURL(file),
      file: file,
    }))
  );
  

  const handleFileUpload = (e) => {
    const fileList = Array.from(e.target.files || []);
    const mappedFiles = fileList.map((file) => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      id: uuidv4(),
    }));
    setFiles(mappedFiles);
    onFilesSelected?.(mappedFiles);
  };

  const previewFile = () => {
    setIsOpen(true);
    if (isCombine) onPreviewFile?.();
  };

  const previewParticularFile = (url) => {
    setFileUrl(url);
    setIsPreviewOpen(true);
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onDeletedFiles?.(updatedFiles);
  };

  

  return (
    <div className="flex flex-col gap-4">
      {!isView ? (
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-red-300 rounded hover:bg-red-50 transition">
            <PreviewIcon width={24} height={24} fill="#D2232A" />
            <span className="font-semibold text-red-600">Upload</span>
            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
          </label>

          {files.length > 0 && (
            <button
              onClick={previewFile}
              className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
              title="Preview Files"
            >
              <PreviewIcon width={24} height={24} fill="#4B5563" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={previewFile}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          <PreviewIcon width={20} height={20} fill="#fff" />
          Preview Files
        </button>
      )}

      {/* Modal - File List */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">Preview Files</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
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
                            <button onClick={() => handleDelete(file.id)} title="Delete">
                              <DeleteIcon width={20} height={20} fill="#D2232A" />
                            </button>
                          )}
                          <button onClick={() => previewParticularFile(file.url)} title="Preview">
                            <EyeIcon width={20} height={20} fill="#4B5563" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-gray-500">No Files Found!</td>
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

      {/* Modal - File Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">File Preview</h2>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              <iframe
                src={fileUrl}
                className="w-full h-[70vh] border rounded"
                title="Preview File"
              ></iframe>
            </div>
            <div className="px-4 py-2 border-t text-right">
              <button
                onClick={() => setIsPreviewOpen(false)}
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
