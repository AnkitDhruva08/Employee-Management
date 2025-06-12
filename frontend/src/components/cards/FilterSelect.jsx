// FilterSelect.jsx
export function FilterSelect({ label, value, onChange, options }) {
    return (
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option || `All ${label}`}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  // FilterInput.jsx
  export function FilterInput({ label, type = "text", value, onChange }) {
    return (
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  