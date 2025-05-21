// components/CkEditor.jsx
import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CkEditor = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className={`border rounded-lg p-2 bg-white ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data); 
        }}
        />
      </div>
    </div>
  );
};

export default CkEditor;
