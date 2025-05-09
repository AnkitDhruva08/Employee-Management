export default function PersonalInfoForm() {
    return (
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold">First Name</label>
          <input type="text" className="input" placeholder="John" />
        </div>
        <div>
          <label className="block font-semibold">Middle Name</label>
          <input type="text" className="input" placeholder="M." />
        </div>
        <div>
          <label className="block font-semibold">Last Name</label>
          <input type="text" className="input" placeholder="Doe" />
        </div>
        <div>
          <label className="block font-semibold">Gender</label>
          <select className="input">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">Contact Number</label>
          <input type="text" className="input" />
        </div>
        <div>
          <label className="block font-semibold">Date of Birth</label>
          <input type="date" className="input" />
        </div>
        <div>
          <label className="block font-semibold">Company Email</label>
          <input type="email" className="input" />
        </div>
        <div>
          <label className="block font-semibold">Personal Email</label>
          <input type="email" className="input" />
        </div>
      </form>
    );
  }
  