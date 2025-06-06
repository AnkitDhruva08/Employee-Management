import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PersonalInfoForm from "./PersonalInfoForm";
import EmergencyContactForm from "./EmergencyContactForm";
import NomineeDetailsForm from "./NomineeDetailsForm";
import BankDetailsForm from "./BankDetailsForm";
import OfficeDetailsForm from "./OfficeDetailsForm";
import DocumentsUploadForm from "./DocumentsUploadForm";
import { fetchUserProfile, fetchDashboardLink, fetchDashboard } from "../../utils/api";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import UploadImageModal from "../File/UploadProfileImage";

const steps = [
  "Personal Info",
  "Emergency Contact",
  "Nominee Details",
  "Bank Details",
  // "Office Details",
  "Documents",
];

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  const stepProps = {
    onNext: () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1)),
    onPrev: () => setCurrentStep((prev) => Math.max(prev - 1, 0)),
    employeeId: id,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <PersonalInfoForm {...stepProps} />;
      case 1: return <EmergencyContactForm {...stepProps} />;
      case 2: return <NomineeDetailsForm {...stepProps} />;
      case 3: return <BankDetailsForm {...stepProps} />;
      // case 4: return <OfficeDetailsForm {...stepProps} />;
      case 4: return <DocumentsUploadForm {...stepProps} />;
      default: return null;
    }
  };

  const fetchData = async () => {
    try {
      const links = await fetchDashboardLink(token);
      setQuickLinks(links.data || links);

      const dashboard = await fetchDashboard(token);
      setDashboardData(dashboard);

      const profileData = await fetchUserProfile(token);
      setUserProfile(profileData.data || profileData);

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data.");
      setLoading(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const percentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-800 text-white p-4 md:p-6">
        <h2 className="text-2xl font-semibold mb-6">{dashboardData?.company || "Dashboard"}</h2>
        <Sidebar quickLinks={quickLinks} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Header title="Employee Form" />
        <div className="max-w-6xl mx-auto mt-6 px-4 pb-16">
          {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200 mx-2 relative">
                  <div
                    className="absolute h-1 bg-blue-600"
                    style={{
                      width: currentStep >= index + 1 ? "100%" : "0%",
                      transition: "width 0.3s ease-in-out",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          {steps.map((label, i) => (
            <span key={i} className={`w-full text-center ${i === currentStep ? "text-blue-600 font-semibold" : ""}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl shadow-xl p-6 transition-all duration-500">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              renderStep()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
