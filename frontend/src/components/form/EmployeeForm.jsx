import React, { useState } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import EmergencyContactForm from "./EmergencyContactForm";
import NomineeDetailsForm from "./NomineeDetailsForm";
import BankDetailsForm from "./BankDetailsForm";
import OfficeDetailsForm from "./OfficeDetailsForm";
import DocumentsUploadForm from "./DocumentsUploadForm";

const steps = [
  "Personal Info",
  "Emergency Contact",
  "Nominee Details",
  "Bank Details",
  "Office Details",
  "Documents",
];

export default function EmployeeForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoForm />;
      case 1:
        return <EmergencyContactForm />;
      case 2:
        return <NomineeDetailsForm />;
      case 3:
        return <BankDetailsForm />;
      case 4:
        return <OfficeDetailsForm />;
      case 5:
        return <DocumentsUploadForm />;
      default:
        return null;
    }
  };

  const percentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-xl">
      {/* Progress Header */}
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

      {/* Form Section */}
      <div className="p-4">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          disabled={currentStep === 0}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
          disabled={currentStep === steps.length - 1}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
