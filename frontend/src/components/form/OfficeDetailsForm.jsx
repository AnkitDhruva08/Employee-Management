import React, { useState } from "react";

export default function OfficeDetailsForm({ onChange }) {
  const [formData, setFormData] = useState({
    date_of_joining: "",
    probation_end: "",
    job_role: "",
    reporting_to: "",
    date_of_leaving: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (onChange) onChange(formData);
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Date of Joining */}
      <div>
        <label className="block font-semibold">Date of Joining</label>
        <input
          type="date"
          name="date_of_joining"
          value={formData.date_of_joining}
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Probation End Date */}
      <div>
        <label className="block font-semibold">Probation End Date</label>
        <input
          type="date"
          name="probation_end"
          value={formData.probation_end}
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Job Role */}
      <div>
        <label className="block font-semibold">Job Role</label>
        <input
          type="text"
          name="job_role"
          value={formData.job_role}
          onChange={handleChange}
          className="input"
          placeholder="e.g., Software Developer"
        />
      </div>

      {/* Reporting To */}
      <div>
        <label className="block font-semibold">Reporting To</label>
        <input
          type="text"
          name="reporting_to"
          value={formData.reporting_to}
          onChange={handleChange}
          className="input"
          placeholder="e.g., John Doe"
        />
      </div>

      {/* Date of Leaving */}
      <div>
        <label className="block font-semibold">Date of Leaving (Optional)</label>
        <input
          type="date"
          name="date_of_leaving"
          value={formData.date_of_leaving}
          onChange={handleChange}
          className="input"
        />
      </div>
    </form>
  );
}
