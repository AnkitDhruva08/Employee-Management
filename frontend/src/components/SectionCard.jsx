// import React from "react";





// const SectionCard = ({ title, fields }) => {
//     return (
//       <div className="bg-white shadow-md rounded-md p-6 mb-6">
//         <h3 className="text-xl font-semibold text-blue-700 mb-4   mb-4 text-blue-60">{title}</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//           {fields.map((field, idx) => (
//             <div key={idx} className="flex flex-col">
//               <label className="text-sm font-medium text-white-600 mb-1">{field.label}</label>
//               <div className="bg-white border border-white-300 p-2 rounded text-sm text-gray-800">
//                 {field.value || "—"}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };
  
//   export default SectionCard;
  




import React from "react";

  const LabeledInput = ({ label, value }) => (
    <div className="w-full px-2 mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {typeof value === "string" || typeof value === "number" ? (
        <input
          type="text"
          value={value || ""}
          disabled
          className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
        />
      ) : (
        value // Render JSX like <img />
      )}
    </div>
  );
  

const SectionCard = ({ title, fields }) => {
  return (
    <div className="bg-white shadow-md rounded-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-blue-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {fields.map((field, idx) => (
          <LabeledInput key={idx} label={field.label} value={field.value} />
        ))}
      </div>
    </div>
  );
};

export default SectionCard;
