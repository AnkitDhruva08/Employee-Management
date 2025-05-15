import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { fetchUserProfile } from "../../utils/api";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import UploadImageModal from "../File/UploadProfileImage";
import { fetchDashboardLink, fetchDashboard } from "../../utils/api";


export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
     const fetchLinks = async () => {
        try {
            const links = await fetchDashboardLink(token);
            setQuickLinks(links.data || links);
          const empDashboard = await fetchDashboard(token);
          setDashboardData(empDashboard);
        } catch (err) {
          console.error("Error fetching dashboard:", err);
          navigate("/login");
        }
      };

  useEffect(() => {
    fetchLinks();
    const fetchData = async () => {
      try {
        const profileData = await fetchUserProfile(token);
        setUserProfile(profileData.data || profileData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch profile");
        setLoading(false);
        navigate("/login");
      }
    };

    fetchData();
  }, [token, navigate]);

  // Safely construct image URL like in Header
  const rawPath = userProfile?.employee?.profile_image;
  const profileImageUrl = rawPath
    ? rawPath.startsWith("http")
      ? rawPath
      : `http://localhost:8000${
          rawPath.startsWith("/") ? "" : "/media/"
        }${rawPath}`
    : null;

  // First letter fallback for initials
  const firstLetter =
    userProfile?.employee?.first_name?.charAt(0)?.toUpperCase() || "U";

  if (loading)
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;
  if (error || !userProfile)
    return (
      <div className="text-center mt-20 text-red-500">
        Error loading profile.
      </div>
    );

  const { employee, role_name, emergency_contacts, office_details } =
    userProfile;

  return (
    <div className="flex h-screen bg-gray-100">
        <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            {dashboardData?.company}
          </h2>
          <Sidebar quickLinks={quickLinks} />
        </div>
        <main className="flex-1 flex flex-col">
      <Header title="Profile" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card Container */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mt-10 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-blue-600 font-medium">{role_name}</p>
              <p className="text-sm text-gray-500">{employee.contact_number}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div>
            <Link
                to={`/employee-form/${employee.id}?step=4`}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg hover:scale-105 transition-transform duration-200"
              >
                ✏️ Update Profile
              </Link>
            </div>
            <div>

            <Link
                 onClick={() => setShowImageModal(true)}
                 className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-indigo-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg hover:scale-105 transition-transform duration-200"
               >
                  Update Profile Picture
              </Link>

            </div>
            


            </div>
          </div>

          {/* Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Side */}
            <div className="space-y-6">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover shadow"
                />
              ) : (
                <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow">
                  {firstLetter}
                </div>
              )}

              {/* Emergency Contacts */}
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-gray-700 font-semibold mb-3">
                  📞 Emergency Contacts
                </h3>
                <div className="space-y-3 text-sm">
                  {emergency_contacts.length > 0 ? (
                    emergency_contacts.map((c, i) => (
                      <div key={i}>
                        <p className="font-medium">{c.emergency_name}</p>
                        <p className="text-gray-500">{c.emergency_relation}</p>
                        <p className="text-gray-600">{c.emergency_contact}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No emergency contacts listed.
                    </p>
                  )}
                </div>
              </div>

              {/* Office Info */}
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-gray-700 font-semibold mb-3">
                  🏢 Work Details
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  {office_details.length > 0 ? (
                    office_details.map((office, i) => (
                      <div key={i}>
                        <p>
                          <strong>Role:</strong> {office.job_role}
                        </p>
                        <p>
                          <strong>Reporting To:</strong> {office.reporting_to}
                        </p>
                        <p>
                          <strong>Joined:</strong> {office.date_of_joining}
                        </p>
                        <p>
                          <strong>Probation Ends:</strong>{" "}
                          {office.probation_end}
                        </p>
                        {office.date_of_leaving && (
                          <p>
                            <strong>Left:</strong> {office.date_of_leaving}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No office details available.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  📋 About
                </h2>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-2 text-sm">
                  <h4 className="text-gray-600 font-semibold">Contact Info</h4>
                  {employee.contact_number && (
                    <p>
                      <strong>Phone:</strong>{" "}
                      <a
                        href={`tel:${employee.contact_number}`}
                        className="text-blue-600"
                      >
                        {employee.contact_number}
                      </a>
                    </p>
                  )}
                  {employee.company_email && (
                    <p>
                      <strong>Company Email:</strong>{" "}
                      <a
                        href={`mailto:${employee.company_email}`}
                        className="text-blue-600"
                      >
                        {employee.company_email}
                      </a>
                    </p>
                  )}
                  {employee.personal_email && (
                    <p>
                      <strong>Personal Email:</strong>{" "}
                      <a
                        href={`mailto:${employee.personal_email}`}
                        className="text-blue-600"
                      >
                        {employee.personal_email}
                      </a>
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-2 text-sm">
                  <h4 className="text-gray-600 font-semibold">Basic Info</h4>
                  {employee.gender && (
                    <p>
                      <strong>Gender:</strong> {employee.gender}
                    </p>
                  )}
                  {employee.date_of_birth && (
                    <p>
                      <strong>DOB:</strong> {employee.date_of_birth}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-2 text-sm">
                  <h4 className="text-gray-600 font-semibold mb-2">
                    OFFICE DETAILS
                  </h4>
                  {office_details.length > 0 ? (
                    office_details.map((office, i) => (
                      <div key={i} className="space-y-1">
                        <p>
                          <strong>Job Role:</strong> {employee.role_name}
                        </p>
                        <p>
                          <strong>Reporting To:</strong> {office.reporting_to}
                        </p>
                        <p>
                          <strong>Date of Joining:</strong>{" "}
                          {office.date_of_joining}
                        </p>
                        <p>
                          <strong>Probation Ends:</strong>{" "}
                          {office.probation_end}
                        </p>
                        {office.date_of_leaving && (
                          <p>
                            <strong>Date of Leaving:</strong>{" "}
                            {office.date_of_leaving}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No office information available.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm shadow-sm transition">
                  📩 Message
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-sm transition">
                  📇 Add Contact
                </button>
                <button className="text-red-500 text-sm hover:underline">
                  🚫 Report
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

         {/* ✅ Render Upload Image Modal */}
              {showImageModal && (
                <UploadImageModal
                  isOpen={showImageModal}
                  onClose={() => setShowImageModal(false)}
                  onUploadSuccess={() => {
                    setShowImageModal(false);
                    window.location.reload(); 
                  }}
                />
              )}

              </main>
    </div>

    
  );
}
