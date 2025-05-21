
const Input = ({ label, name, value, onChange, type = "text", disabled = false }) => (
    <div>
      <label className="block text-sm text-gray-700 font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );


export default Input;