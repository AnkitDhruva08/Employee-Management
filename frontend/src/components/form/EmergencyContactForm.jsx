import React, { useState } from "react";

export default function EmergencyContactForm({ onChange }) {
  const [formData, setFormData] = useState({
    emergency_name: "",
    emergency_relation: "",
    emergency_contact: "",
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
        <label className="block font-semibold">Emergency Contact Name</label>
        <input
          type="text"
          name="emergency_name"
          value={formData.emergency_name}
          onChange={handleChange}
          className="input"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="block font-semibold">Relation</label>
        <input
          type="text"
          name="emergency_relation"
          value={formData.emergency_relation}
          onChange={handleChange}
          className="input"
          placeholder="Sister, Father, Friend..."
        />
      </div>
      <div>
        <label className="block font-semibold">Emergency Contact Number</label>
        <input
          type="text"
          name="emergency_contact"
          value={formData.emergency_contact}
          onChange={handleChange}
          className="input"
          placeholder="9876543210"
        />
      </div>
    </form>
  );
}
