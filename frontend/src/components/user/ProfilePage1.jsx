import React from "react";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-blue-500 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-5xl w-full p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold text-blue-700">Kodecolor</div>
          <div className="flex items-center space-x-6">
            <input
              type="text"
              placeholder="Search"
              className="border px-3 py-1 rounded-lg text-sm"
            />
            <a href="#" className="text-sm text-gray-700 hover:underline">
              Find people
            </a>
            <a href="#" className="text-sm text-gray-700 hover:underline relative">
              Messages <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-xs px-1 rounded-full">4</span>
            </a>
            <a href="#" className="text-sm text-gray-700 hover:underline">
              My Contacts
            </a>
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-10">
          {/* Left Section */}
          <div className="flex-shrink-0 w-full md:w-1/3">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              className="rounded-xl object-cover w-full h-64"
              alt="Jeremy Rose"
            />
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">WORK</h3>
              <div className="text-sm">
                <div className="mb-2">
                  <div className="font-medium">Spotify New York <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded ml-1">Primary</span></div>
                  <p className="text-gray-500 text-xs">
                    170 William Street<br />
                    New York, NY 10038-78 212-312-31
                  </p>
                </div>
                <div>
                  <div className="font-medium">Metropolitan Museum <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded ml-1">Secondary</span></div>
                  <p className="text-gray-500 text-xs">
                    525 E 68th Street<br />
                    New York, NY 10651-78 156-187-60
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">SKILLS</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Branding</li>
                <li>UI/UX</li>
                <li>Web – Design</li>
                <li>Packaging</li>
                <li>Print & Editorial</li>
              </ul>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Jeremy Rose</h1>
                <p className="text-blue-600 font-medium">Product Designer</p>
                <p className="text-sm text-gray-500">New York, NY</p>
              </div>
              <div className="text-gray-400 text-xl cursor-pointer">🔖</div>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <span className="font-semibold text-lg text-black mr-2">8,6</span>
              <div className="flex text-blue-500">
                ★ ★ ★ ★ ☆
              </div>
            </div>

            <div className="flex space-x-4 mb-6">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm">
                📩 Send message
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm">
                📇 Contacts
              </button>
              <button className="text-red-500 text-sm">Report user</button>
            </div>

            <div className="flex space-x-6 border-b mb-4 pb-2">
              <button className="text-gray-500 text-sm hover:text-gray-700">Timeline</button>
              <button className="border-b-2 border-blue-500 text-blue-600 font-medium text-sm">About</button>
            </div>

            {/* About Info */}
            <div className="space-y-6 text-sm text-gray-800">
              <div>
                <h4 className="font-semibold text-gray-500 mb-1">CONTACT INFORMATION</h4>
                <p><strong>Phone:</strong> <a href="tel:+11234567890" className="text-blue-500">+1 123 456 7890</a></p>
                <p><strong>Address:</strong> 525 E 68th Street, New York, NY 10651-78 156-187-60</p>
                <p><strong>Email:</strong> <a href="mailto:hello@jeremyrose.com" className="text-blue-500">hello@jeremyrose.com</a></p>
                <p><strong>Site:</strong> <a href="http://www.jeremyrose.com" className="text-blue-500">www.jeremyrose.com</a></p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-500 mb-1">BASIC INFORMATION</h4>
                <p><strong>Birthday:</strong> June 5, 1992</p>
                <p><strong>Gender:</strong> Male</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
