import React, { useState } from "react";

export default function BankDetailsForm({ onChange }) {
  const [formData, setFormData] = useState({
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
    ifsc_code: "",
    account_number: "",
    account_type: "saving", // default to saving
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
        <label className="block font-semibold">Account Holder Name</label>
        <input
          type="text"
          name="account_holder_name"
          value={formData.account_holder_name}
          onChange={handleChange}
          className="input"
          placeholder="e.g., John Doe"
        />
      </div>

      <div>
        <label className="block font-semibold">Bank Name</label>
        <input
          type="text"
          name="bank_name"
          value={formData.bank_name}
          onChange={handleChange}
          className="input"
          placeholder="e.g., National Bank"
        />
      </div>

      <div>
        <label className="block font-semibold">Branch Name</label>
        <input
          type="text"
          name="branch_name"
          value={formData.branch_name}
          onChange={handleChange}
          className="input"
          placeholder="e.g., New York Branch"
        />
      </div>

      <div>
        <label className="block font-semibold">IFSC Code</label>
        <input
          type="text"
          name="ifsc_code"
          value={formData.ifsc_code}
          onChange={handleChange}
          className="input"
          placeholder="e.g., NB00012345"
        />
      </div>

      <div>
        <label className="block font-semibold">Account Number</label>
        <input
          type="text"
          name="account_number"
          value={formData.account_number}
          onChange={handleChange}
          className="input"
          placeholder="e.g., 1234567890123456"
        />
      </div>

      <div>
        <label className="block font-semibold">Account Type</label>
        <select
          name="account_type"
          value={formData.account_type}
          onChange={handleChange}
          className="input"
        >
          <option value="saving">Saving</option>
          <option value="salary">Salary</option>
        </select>
      </div>
    </form>
  );
}
