import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchUserProfile,
  fetchDashboardLink,
  fetchDashboard,
} from "../../utils/api";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import UploadImageModal from "../File/UploadProfileImage";
import { MapPin, Building, Globe, Hash, Flag, Edit, Camera, Phone, Mail } from "lucide-react"; 
import CompanyLogo from "../CompanyLogo";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [roleName, setRoleName] = useState('');
  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isCompany = localStorage.getItem("is_company") === "true";
  const isSuperUser = localStorage.getItem("is_superuser") === "true";
  const navigate = useNavigate();

  const fetchInitialData = async () => {
    try {
      const links = await fetchDashboardLink(token);
      setQuickLinks(links.data || links);
      const empDashboard = await fetchDashboard(token);
      setDashboardData(empDashboard);
    } catch (err) {
      console.error("Error fetching dashboard/links:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const fetchData = async () => {
      try {
        const profileData = await fetchUserProfile(token);
        setUserProfile(profileData.data || profileData);
        setRoleName(profileData.role_name);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch profile. Please try again or log in.");
        setLoading(false);
        navigate("/login");
      }
    };

    fetchData();
  }, [token, navigate]);

  // Derived state for display
  let displayImageUrl = null;
  let firstLetter = "U";
  let profileName = "Loading...";
  let profileRole = "";
  let contactNumber = "";
  let primaryEmail = "";

  if (userProfile) {
    if (isCompany) {
      const rawPath = userProfile.profile_image ;
      if (rawPath) {
        displayImageUrl = rawPath.startsWith("http")
          ? rawPath
          : `http://localhost:8000${
              rawPath.startsWith("/") ? "" : "/media/"
            }${rawPath}`;
      }
      profileName = userProfile.company_name || "Company";
      profileRole = "Company Account";
      contactNumber = userProfile.contact_number || "";
      primaryEmail = userProfile.email || "";
      firstLetter = profileName.charAt(0)?.toUpperCase() || "C";
    } else {
      const rawPath = userProfile.employee?.profile_image;
      if (rawPath) {
        displayImageUrl = rawPath.startsWith("http")
          ? rawPath
          : `http://localhost:8000${
              rawPath.startsWith("/") ? "" : "/media/"
            }${rawPath}`;
      }
      profileName = `${userProfile.employee?.first_name || ""} ${
        userProfile.employee?.last_name || ""
      }`.trim();
      profileRole = userProfile.role_name || "";
      contactNumber = userProfile.employee?.contact_number || "";
      primaryEmail =
        userProfile.employee?.company_email ||
        userProfile.employee?.personal_email ||
        "";
      firstLetter = profileName.charAt(0)?.toUpperCase() || "U";
    }
  }

  // Handle double-click on profile image/placeholder
  const handleProfileImageClick = () => {
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="ml-5 text-2xl font-semibold text-gray-800">
          Loading your profile, just a moment...
        </p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-10 bg-white border border-red-400 text-red-700 rounded-xl shadow-2xl animate-fade-in">
          <p className="text-3xl font-bold mb-4">Oops! Something went wrong.</p>
          <p className="text-xl mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-8 py-4 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const { employee, emergency_contacts, office_details } = userProfile;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div className="bg-gray-800 text-white w-64 p-6 flex flex-col shadow-lg">
      {dashboardData && (
          <CompanyLogo
            logoPath={dashboardData.company_logo}
          />
        )}
        <Sidebar quickLinks={quickLinks} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={isCompany ? "Company Profile" : "Employee Profile"} />

        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-gradient-to-br from-gray-50 to-indigo-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white shadow-2xl rounded-3xl p-8 mb-8 transform transition-all duration-500 hover:scale-[1.005] border border-gray-100 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    {profileName}
                  </h1>
                  <p className="text-indigo-700 font-semibold text-xl mt-2">
                    {profileRole}
                  </p>
                  {contactNumber && (
                    <p className="text-md text-gray-700 mt-2 flex items-center">
                      <Phone size={18} className="mr-2 text-indigo-500" />{" "}
                      {contactNumber}
                    </p>
                  )}
                  {primaryEmail && (
                    <p className="text-md text-gray-700 flex items-center">
                      <Mail size={18} className="mr-2 text-indigo-500" />{" "}
                      {primaryEmail}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-4 mt-4 sm:mt-0">
                  {!isCompany && roleId && (
                    <Link
                      to={`/employee-form/${employee?.id}`}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-6 py-3 rounded-full text-base font-medium shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl"
                    >
                      <Edit size={20} /> Update Profile
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="space-y-8">
                  <div className="flex justify-center lg:justify-start">
                    <div
                      onClick={handleProfileImageClick} 
                      className={`relative group cursor-pointer ${
                        isCompany ? "rounded-xl" : "rounded-full"
                      } overflow-hidden w-52 h-52 border-4 border-white shadow-xl transition-transform duration-300 transform hover:scale-105`}
                    >
                      {displayImageUrl ? (
                        <img
                          src={displayImageUrl}
                          alt={isCompany ? "Company Logo" : "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-indigo-600 text-white flex items-center justify-center text-6xl font-bold`}
                        >
                          {firstLetter}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Camera size={48} className="text-white" />
                        <span className="ml-3 text-white text-lg font-semibold">
                          {isCompany ? "Update Logo" : "Update Picture"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isCompany && roleId && (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 animate-fade-in-up delay-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-red-500 mr-3">📞</span> Emergency
                        Contacts
                      </h3>
                      <div className="space-y-4 text-base text-gray-700">
                        {emergency_contacts?.length > 0 ? (
                          emergency_contacts.map((c, i) => (
                            <div
                              key={i}
                              className="pb-3 last:pb-0 border-b last:border-b-0 border-gray-100"
                            >
                              <p className="font-semibold text-gray-900">
                                {c.emergency_name}
                              </p>
                              <p className="text-gray-600">
                                {c.emergency_relation}
                              </p>
                              <p className="text-blue-600 hover:underline cursor-pointer">
                                {c.emergency_contact}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 italic">
                            No emergency contacts listed.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isCompany && roleId && (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 animate-fade-in-up delay-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-green-500 mr-3">🏢</span> Work
                        Details
                      </h3>
                      <div className="text-base text-gray-700 space-y-3">
                        {office_details?.length > 0 ? (
                          office_details.map((office, i) => (
                            <div
                              key={i}
                              className="pb-3 last:pb-0 border-b last:border-b-0 border-gray-100"
                            >
                              <p>
                                <strong>Role:</strong>{" "}
                                {roleName || "N/A"}
                              </p>
                              <p>
                                <strong>Reporting To:</strong>{" "}
                                {office.reporting_to || "N/A"}
                              </p>
                              <p>
                                <strong>Joined:</strong>{" "}
                                {office.date_of_joining || "N/A"}
                              </p>
                              <p>
                                <strong>Probation Ends:</strong>{" "}
                                {office.probation_end || "N/A"}
                              </p>
                              {office.date_of_leaving && (
                                <p>
                                  <strong>Left:</strong>{" "}
                                  {office.date_of_leaving}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 italic">
                            No office details available.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {isCompany && (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 animate-fade-in-up delay-300">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-blue-500 mr-3">📊</span> Company
                        Specifics
                      </h3>
                      <div className="text-base text-gray-700 space-y-3">
                        <p>
                          <strong>Team Size:</strong>{" "}
                          {userProfile?.team_size || "N/A"}
                        </p>
                        <div className="pt-4 border-t border-gray-100">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            Company Address
                          </h4>
                          <div className="space-y-2">
                            <p className="flex items-center">
                              <MapPin className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                              <strong className="text-gray-900 mr-1">
                                Street:
                              </strong>
                              <span className="break-words">
                                {userProfile?.street_address || "N/A"}
                              </span>
                            </p>

                            <p className="flex items-center">
                              <Building className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                              <strong className="text-gray-900 mr-1">
                                City:
                              </strong>
                              <span className="break-words">
                                {userProfile?.city || "N/A"}
                              </span>
                            </p>

                            <p className="flex items-center">
                              <Globe className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                              <strong className="text-gray-900 mr-1">
                                State/Province:
                              </strong>
                              <span className="break-words">
                                {userProfile?.state_province || "N/A"}
                              </span>
                            </p>

                            <p className="flex items-center">
                              <Hash className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                              <strong className="text-gray-900 mr-1">
                                Zip Code:
                              </strong>
                              <span className="break-words">
                                {userProfile?.zip_code || "N/A"}
                              </span>
                            </p>

                            <p className="flex items-center">
                              <Flag className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                              <strong className="text-gray-900 mr-1">
                                Country:
                              </strong>
                              <span className="break-words">
                                {userProfile?.country || "N/A"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 animate-fade-in-up delay-400">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="text-orange-500 mr-3">ℹ️</span> About
                    </h2>

                    <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-base text-gray-700">
                        {!isCompany && employee?.contact_number && (
                          <p>
                            <strong>Phone:</strong>{" "}
                            <a
                              href={`tel:${employee.contact_number}`}
                              className="text-blue-600 hover:underline"
                            >
                              {employee.contact_number}
                            </a>
                          </p>
                        )}
                        {!isCompany && employee?.company_email && (
                          <p>
                            <strong>Company Email:</strong>{" "}
                            <a
                              href={`mailto:${employee.company_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {employee.company_email}
                            </a>
                          </p>
                        )}
                        {!isCompany && employee?.personal_email && (
                          <p>
                            <strong>Personal Email:</strong>{" "}
                            <a
                              href={`mailto:${employee.personal_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {employee.personal_email}
                            </a>
                          </p>
                        )}
                        {isCompany && userProfile?.contact_number && (
                          <p>
                            <strong>Phone:</strong>{" "}
                            <a
                              href={`tel:${userProfile.contact_number}`}
                              className="text-blue-600 hover:underline"
                            >
                              {userProfile.contact_number}
                            </a>
                          </p>
                        )}
                        {isCompany && userProfile?.email && (
                          <p>
                            <strong>Company Email:</strong>{" "}
                            <a
                              href={`mailto:${userProfile.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {userProfile.email}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCompany && roleId && (
                      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                          Basic Information
                        </h4>
                        <div className="space-y-2 text-base text-gray-700">
                          {employee?.gender && (
                            <p>
                              <strong>Gender:</strong> {employee.gender}
                            </p>
                          )}
                          {employee?.date_of_birth && (
                            <p>
                              <strong>DOB:</strong> {employee.date_of_birth}
                            </p>
                          )}
                          {employee?.marital_status && (
                            <p>
                              <strong>Marital Status:</strong>{" "}
                              {employee.marital_status}
                            </p>
                          )}
                          {employee?.nationality && (
                            <p>
                              <strong>Nationality:</strong>{" "}
                              {employee.nationality}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                    <button className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-full text-base font-medium shadow-sm transition-all duration-200 transform hover:scale-105">
                      📩 Message
                    </button>
                    <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-base font-medium shadow-sm transition-all duration-200 transform hover:scale-105">
                      📇 Add Contact
                    </button>
                    <button className="flex items-center gap-2 text-red-500 text-base hover:underline hover:text-red-700 transition-colors duration-200">
                      🚫 Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showImageModal && (
          <UploadImageModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onUploadSuccess={async () => {
              setShowImageModal(false);
              try {
                const profileData = await fetchUserProfile(token);
                setUserProfile(profileData.data || profileData);
              } catch (err) {
                setError("Failed to re-fetch profile after image upload.");
              }
            }}
            uploadFor={isCompany ? "company" : "employee"}
          />
        )}
      </main>
    </div>
  );
}