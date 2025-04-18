import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { addDays, format } from "date-fns";

const Leave = () => {
  const [newLeave, setNewLeave] = useState({
    duration: "Single day",
    from_date: "",
    to_date: "",
    reason: "",
    attachment: null,
  });
  const [showDateRange, setShowDateRange] = useState(true);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate("/login");
  }, []);

  useEffect(() => {
    if (newLeave.duration === "Multiple days") {
      setShowDateRange(true);
      const { startDate, endDate } = dateRange[0];
      setNewLeave((prev) => ({
        ...prev,
        from_date: format(startDate, "yyyy-MM-dd"),
        to_date: format(endDate, "yyyy-MM-dd"),
      }));
    } else {
      setShowDateRange(false);
      setNewLeave((prev) => ({
        ...prev,
        to_date: "",
      }));
    }
  }, [newLeave.duration, dateRange]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setNewLeave((prev) => ({ ...prev, attachment: files[0] }));
    } else {
      setNewLeave((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleQuillChange = (content) => {
    setNewLeave((prev) => ({ ...prev, reason: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("duration", newLeave.duration);
    formData.append("from_date", newLeave.from_date);
    formData.append("to_date", newLeave.to_date);
    formData.append("reason", newLeave.reason);
    if (newLeave.attachment) {
      formData.append("attachment", newLeave.attachment);
    }

    const res = await fetch("http://localhost:8000/api/leaves/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      setMessage("Leave Applied Successfully");
      setNewLeave({
        duration: "Single day",
        from_date: "",
        to_date: "",
        reason: "",
        attachment: null,
      });
    } else {
      setMessage("Failed to apply leave.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Apply for a leave(s)</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Select duration</label>
          <select
  name="duration"
  value={newLeave.duration}
  onChange={handleChange}
  className="w-full border rounded px-3 py-2"
>
  <option value="Single day">Single day</option>
  <option value="Half day">Half day</option>
  <option value="Multiple days">Multiple days</option>
</select>

        </div>

        {showDateRange ? (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Select Date Range</label>
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
            />
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
              <input
                type="date"
                name="from_date"
                value={newLeave.from_date}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Reason</label>
          <ReactQuill
            theme="snow"
            value={newLeave.reason}
            onChange={handleQuillChange}
            className="bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Attach any doc (optional)</label>
          <input
            type="file"
            name="attachment"
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bg-cyan-500 text-white px-6 py-2 rounded hover:bg-cyan-600"
          >
            Submit
          </button>
        </div>

        {message && <p className="text-green-600 font-medium">{message}</p>}
      </form>
    </div>
  );
};

export default Leave;
