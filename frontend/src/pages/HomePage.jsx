import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Smart HRMS Portal</h1>
        <p className="text-lg md:text-xl mb-8">Manage your company, employees, leaves, holidays, and more with ease.</p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="bg-white text-blue-700 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 transition">
            Register Company
          </Link>
          <Link to="/login" className="bg-transparent border border-white text-white font-semibold py-2 px-6 rounded-full hover:bg-white hover:text-blue-700 transition">
            Login
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-100 text-gray-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-2">Company Management</h3>
            <p>Register, manage roles, view employee data, handle leave requests, and organize events.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-2">Employee Dashboard</h3>
            <p>Apply for leaves, check calendar & events, view your working history and personal data.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-2">Smart Leave System</h3>
            <p>Auto monthly leave allocation, PL after 240 days, and easy leave tracking.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p>© {new Date().getFullYear()} Smart HRMS | All Rights Reserved</p>
      </footer>
    </div>
  );
}
