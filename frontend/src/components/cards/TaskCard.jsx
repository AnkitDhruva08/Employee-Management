export default function TaskCard({ title, count, color }) {
    return (
      <div className={`bg-${color}-100 border-l-4 border-${color}-500 p-4 rounded-lg shadow`}>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    );
  }
  