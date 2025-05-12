import React, { createContext, useState, useContext } from 'react';

const FormContext = createContext();

export const useFormContext = () => useContext(FormContext);

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    personalInfo: {},
    emergencyContact: {},
    nomineeDetails: {},
    bankDetails: {},
    officeDetails: {},
    documents: {},
  });
  const [currentStep, setCurrentStep] = useState(0);

  const updateFormData = (step, data) => {
    setFormData((prevData) => ({
      ...prevData,
      [step]: data,
    }));
  };

  return (
    <FormContext.Provider value={{ formData, updateFormData, currentStep, setCurrentStep }}>
      {children}
    </FormContext.Provider>
  );
};
