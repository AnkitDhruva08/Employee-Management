import React, { useState } from "react";

export default function NomineeDetailsForm({ onChange }) {
  const [formData, setFormData] = useState({
    nominee_name: "",
    nominee_dob: "",
    nominee_relation: "",
    nominee_contact: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (onChange) onChange(updated);
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block font-semibold">Nominee Name</label>
        <input
          type="text"
          name="nominee_name"
          value={formData.nominee_name}
          onChange={handleChange}
          className="input"
          placeholder="e.g., John Doe"
        />
      </div>

      <div>
        <label className="block font-semibold">Date of Birth</label>
        <input
          type="date"
          name="nominee_dob"
          value={formData.nominee_dob}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div>
        <label className="block font-semibold">Relation</label>
        <input
          type="text"
          name="nominee_relation"
          value={formData.nominee_relation}
          onChange={handleChange}
          className="input"
          placeholder="Spouse, Son, Mother..."
        />
      </div>

      <div>
        <label className="block font-semibold">Contact Number</label>
        <input
          type="text"
          name="nominee_contact"
          value={formData.nominee_contact}
          onChange={handleChange}
          className="input"
          placeholder="9876543210"
        />
      </div>
    </form>
  );
}
