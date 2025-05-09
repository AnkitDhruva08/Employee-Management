import React from "react";
import { Link } from "react-router-dom";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-4">
      <div className="bg-white rounded-xl shadow max-w-4xl w-full relative overflow-hidden">

        {/* Banner */}
        <div className="bg-blue-600 h-32 relative">
          <img
            src="https://randomuser.me/api/portraits/men/75.jpg"
            alt="Profile"
            className="absolute bottom-[-40px] left-6 w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
          />
        </div>

        {/* Main Info */}
        <div className="pt-16 px-6 pb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Jeremy Rose</h1>
              <p className="text-blue-600 text-sm">Product Designer at Spotify</p>
              <p className="text-gray-600 text-sm">New York, NY • 500+ connections</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">
                Connect
              </button>
              <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50">
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t"></div>

        {/* About Section */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Passionate product designer with 8+ years of experience in building
            intuitive and scalable design systems. Specialized in UX/UI and product strategy.
          </p>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-4 border-t">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Email:</strong> <a href="mailto:hello@jeremyrose.com" className="text-blue-600">hello@jeremyrose.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+11234567890" className="text-blue-600">+1 123 456 7890</a></p>
            <p><strong>Website:</strong> <a href="http://www.jeremyrose.com" className="text-blue-600">www.jeremyrose.com</a></p>
            <p><strong>Location:</strong> New York, NY</p>
          </div>
        </div>
      </div>
    </div>
  );
}
