import React, { useState } from 'react';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    // Personal Details
    first_name: '',
    middle_name: '',
    last_name: '',
    present_address: '',
    permanent_address: '',
    contact_number: '',
    company_email: '',
    personal_email: '',
    dob: '',
    gender: '',
    blood_group: '',
    marital_status: '',
    spouse_name: '',

    // Emergency Contact
    emergency_name: '',
    emergency_relation: '',
    emergency_contact: '',

    // Nomination
    nominee_name: '',
    nominee_dob: '',
    nominee_relation: '',
    nominee_contact: '',

    // Bank Details
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    ifsc: '',
    account_number: '',
    account_type: '',
    bank_doc: null,

    // Office Details
    date_of_joining: '',
    probation_end: '',
    job_role: '',
    reporting_to: '',
    date_of_leaving: '',

    // Documents
    photo: null,
    aadhar: null,
    pan: null,
    dl: null,
    appointment: null,
    promotion: null,
    resume: null,
    insurance_number: '',
    esic_card: null,
    epf_member: '',
    uan: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Unauthorized. Please login again.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      const response = await fetch('http://localhost:8000/api/employees/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        setSuccess('Employee added successfully!');
        setFormData({});
      } else {
        const errorData = await response.json();
        setError(errorData?.error || 'Failed to add employee');
      }
    } catch (err) {
      console.error(err);
      setError('Server error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Add New Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* PERSONAL DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
          <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
          <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
          <Input label="Present Address" name="present_address" value={formData.present_address} onChange={handleChange} />
          <Input label="Permanent Address" name="permanent_address" value={formData.permanent_address} onChange={handleChange} />
          <Input label="Contact Number" name="contact_number" value={formData.contact_number} onChange={handleChange} />
          <Input label="Company Email" name="company_email" value={formData.company_email} onChange={handleChange} />
          <Input label="Personal Email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
          <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
          <Select label="Gender" name="gender" options={["Male", "Female"]} value={formData.gender} onChange={handleChange} />
          <Select label="Blood Group" name="blood_group" options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} value={formData.blood_group} onChange={handleChange} />
          <Input label="Marital Status" name="marital_status" value={formData.marital_status} onChange={handleChange} />
          <Input label="Spouse Name (if Married)" name="spouse_name" value={formData.spouse_name} onChange={handleChange} />
        </div>

        {/* EMERGENCY CONTACT */}
        <SectionTitle title="Emergency Contact" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Name" name="emergency_name" value={formData.emergency_name} onChange={handleChange} />
          <Select label="Relation" name="emergency_relation" options={["Father", "Mother", "Spouse", "Friend"]} value={formData.emergency_relation} onChange={handleChange} />
          <Input label="Contact Number" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
        </div>

        {/* NOMINATION */}
        <SectionTitle title="Nomination Details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Name" name="nominee_name" value={formData.nominee_name} onChange={handleChange} />
          <Input label="Date of Birth" type="date" name="nominee_dob" value={formData.nominee_dob} onChange={handleChange} />
          <Select label="Relation" name="nominee_relation" options={["Child", "Spouse", "Parent"]} value={formData.nominee_relation} onChange={handleChange} />
          <Input label="Contact Number" name="nominee_contact" value={formData.nominee_contact} onChange={handleChange} />
        </div>

        {/* BANK DETAILS */}
        <SectionTitle title="Bank Details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Account Holder's Name" name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} />
          <Input label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleChange} />
          <Input label="Branch Name" name="branch_name" value={formData.branch_name} onChange={handleChange} />
          <Input label="IFSC" name="ifsc" value={formData.ifsc} onChange={handleChange} />
          <Input label="Account Number" name="account_number" value={formData.account_number} onChange={handleChange} />
          <Select label="Account Type" name="account_type" options={["Saving", "Salary"]} value={formData.account_type} onChange={handleChange} />
          <FileInput label="Bank Document (PDF)" name="bank_doc" onChange={handleChange} />
        </div>

        {/* OFFICE DETAILS */}
        <SectionTitle title="Office Details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Date of Joining" type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} />
          <Input label="Probation End Date" type="date" name="probation_end" value={formData.probation_end} onChange={handleChange} />
          <Input label="Job Role / Designation" name="job_role" value={formData.job_role} onChange={handleChange} />
          <Input label="Reporting To" name="reporting_to" value={formData.reporting_to} onChange={handleChange} />
          <Input label="Date of Leaving" type="date" name="date_of_leaving" value={formData.date_of_leaving} onChange={handleChange} />
        </div>

        {/* DOCUMENTS */}
        <SectionTitle title="Attached Documents" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileInput label="Passport Photo" name="photo" onChange={handleChange} />
          <FileInput label="Aadhar Card" name="aadhar" onChange={handleChange} />
          <FileInput label="PAN Card" name="pan" onChange={handleChange} />
          <FileInput label="DL" name="dl" onChange={handleChange} />
          <FileInput label="Appointment Letter" name="appointment" onChange={handleChange} />
          <FileInput label="Promotion/ Appraisal" name="promotion" onChange={handleChange} />
          <FileInput label="Resume" name="resume" onChange={handleChange} />
          <Input label="Medical Insurance Number" name="insurance_number" value={formData.insurance_number} onChange={handleChange} />
          <FileInput label="ESIC Card" name="esic_card" onChange={handleChange} />
          <Select label="EPF Member Before?" name="epf_member" options={["Yes", "No"]} value={formData.epf_member} onChange={handleChange} />
          <Input label="UAN" name="uan" value={formData.uan} onChange={handleChange} />
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
          Add Employee
        </button>
      </form>
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full mt-1 p-2 border rounded-md"
    />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full mt-1 p-2 border rounded-md">
      <option value="">-- Select --</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const FileInput = ({ label, name, onChange }) => (
  <div>
    <label className="block text-sm text-gray-700 font-medium">{label}</label>
    <input type="file" name={name} onChange={onChange} className="w-full mt-1" />
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="text-xl font-semibold mt-8 text-gray-700">{title}</h3>
);

export default AddEmployee;
