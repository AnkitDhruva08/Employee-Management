import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Briefcase, UserCheck, LogOut, Clock } from "lucide-react";

const OfficeDetails = () => {
  const [officeData, setOfficeData] = useState({
    date_of_joining: "",
    probation_end: "",
    job_role: "",
    reporting_to: "",
    date_of_leaving: "",
  });

  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Simulate fetch call
    const fetchOfficeDetails = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/employee-office-details/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const office = data[0];
            setOfficeData(office);
            calculateDuration(office.date_of_joining, office.date_of_leaving);
            setIsUpdating(true);
          }
        }
      } catch (err) {
        setError("Error fetching office details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOfficeDetails();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...officeData, [name]: value };
    setOfficeData(updatedData);

    if (name === "date_of_joining" || name === "date_of_leaving") {
      calculateDuration(updatedData.date_of_joining, updatedData.date_of_leaving);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      days += 30;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    setDuration({ years, months, days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        isUpdating
          ? `http://localhost:8000/api/employee-office-details/${officeData.id}/`
          : "http://localhost:8000/api/employee-office-details/",
        {
          method: isUpdating ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(officeData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit data.");
      }

      setSuccess(isUpdating ? "Office details updated." : "Office details added.");
      setIsUpdating(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-3xl mt-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        {isUpdating ? "Update Office Details*" : "Add Office Details*"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date of Joining */}
        <Field
          label="Date of Joining"
          name="date_of_joining"
          value={officeData.date_of_joining}
          onChange={handleChange}
          type="date"
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
        />

        {/* Probation End Date */}
        <Field
          label="Probation End Date"
          name="probation_end"
          value={officeData.probation_end}
          onChange={handleChange}
          type="date"
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
        />

        {/* Job Role */}
        <Field
          label="Job Role / Designation"
          name="job_role"
          value={officeData.job_role}
          onChange={handleChange}
          type="text"
          icon={<Briefcase className="w-5 h-5 text-blue-500" />}
        />

        {/* Reporting To */}
        <Field
          label="Reporting To (Name / Designation)"
          name="reporting_to"
          value={officeData.reporting_to}
          onChange={handleChange}
          type="text"
          icon={<UserCheck className="w-5 h-5 text-blue-500" />}
        />

        {/* Date of Leaving */}
        <Field
          label="Date of Leaving"
          name="date_of_leaving"
          value={officeData.date_of_leaving}
          onChange={handleChange}
          type="date"
          icon={<LogOut className="w-5 h-5 text-blue-500" />}
        />

        {/* Duration */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Working Duration</h3>
          </div>
          <p className="text-sm text-gray-700">
            {duration.years} Year(s), {duration.months} Month(s), {duration.days} Day(s)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          {loading ? "Submitting..." : isUpdating ? "Update Details" : "Submit Details"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm text-center">{success}</p>}
    </div>
  );
};

const Field = ({ label, name, value, onChange, type, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="flex items-center gap-2">
      {icon}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
      />
    </div>
  </div>
);

export default OfficeDetails;
