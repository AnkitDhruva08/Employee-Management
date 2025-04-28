// FileUpload.js
import { useState } from "react";

const FileUpload = ({ label, name, onFileChange, file }) => {
    const [previewUrl, setPreviewUrl] = useState(file || null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            onFileChange(selectedFile);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onFileChange(null);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium">{label}</label>
            <input
                type="file"
                name={name}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full mt-1 p-2 border rounded-lg"
            />
            {previewUrl && (
                <div className="flex items-center gap-3">
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                    >
                        View File
                    </a>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-red-600 text-sm underline"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
