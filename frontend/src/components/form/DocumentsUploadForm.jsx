import React, { useState } from "react";

export default function DocumentsUploadForm({ onChange }) {
  const [formData, setFormData] = useState({
    insurance_number: "",
    epf_member: "",
    uan: "",
    photo: null,
    aadhar: null,
    pan: null,
    dl: null,
    appointment: null,
    promotion: null,
    resume: null,
    esic_card: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
    if (onChange) onChange(formData);
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Insurance Number */}
      <div>
        <label className="block font-semibold">Insurance Number</label>
        <input
          type="text"
          name="insurance_number"
          value={formData.insurance_number}
          onChange={handleChange}
          className="input"
          placeholder="e.g., INS123456"
        />
      </div>

      {/* EPF Member */}
      <div>
        <label className="block font-semibold">EPF Member Number</label>
        <input
          type="text"
          name="epf_member"
          value={formData.epf_member}
          onChange={handleChange}
          className="input"
          placeholder="e.g., EPF123456"
        />
      </div>

      {/* UAN */}
      <div>
        <label className="block font-semibold">UAN (Universal Account Number)</label>
        <input
          type="text"
          name="uan"
          value={formData.uan}
          onChange={handleChange}
          className="input"
          placeholder="e.g., UAN123456"
        />
      </div>

      {/* Photo */}
      <div>
        <label className="block font-semibold">Upload Photo</label>
        <input
          type="file"
          name="photo"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Aadhar */}
      <div>
        <label className="block font-semibold">Upload Aadhar</label>
        <input
          type="file"
          name="aadhar"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* PAN */}
      <div>
        <label className="block font-semibold">Upload PAN Card</label>
        <input
          type="file"
          name="pan"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Driving License */}
      <div>
        <label className="block font-semibold">Upload Driving License</label>
        <input
          type="file"
          name="dl"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Appointment Letter */}
      <div>
        <label className="block font-semibold">Upload Appointment Letter</label>
        <input
          type="file"
          name="appointment"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Promotion Letter */}
      <div>
        <label className="block font-semibold">Upload Promotion Letter</label>
        <input
          type="file"
          name="promotion"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Resume */}
      <div>
        <label className="block font-semibold">Upload Resume</label>
        <input
          type="file"
          name="resume"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* ESIC Card */}
      <div>
        <label className="block font-semibold">Upload ESIC Card</label>
        <input
          type="file"
          name="esic_card"
          onChange={handleChange}
          className="input"
        />
      </div>
    </form>
  );
}
