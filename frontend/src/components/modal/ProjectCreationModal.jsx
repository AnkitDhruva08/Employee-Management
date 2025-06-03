import React, { useState, useEffect } from "react";
import Select from "react-select";
import CkEditor from "../editor/CkEditor";
import FileUpload from "../File/FileUpload";
import Swal from "sweetalert2";
import { fetchCurrentUserDetails } from "../../utils/api";

const ProjectCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  isEditMode,
}) => {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData, isEditMode)
  );
  const [originalDescription, setOriginalDescription] = useState("");
  const [existingSrsFileUrl, setExistingSrsFileUrl] = useState("");
  const [existingWireframeFileUrl, setExistingWireframeFileUrl] = useState("");
  const [loggedInEmployeeName, setLoggedInEmployeeName] = useState("");

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id"));
  const isEmployee = roleId === 3;
  const isManagerOrAdmin = roleId === 1;
  const isCompany = localStorage.getItem("is_company") === "true";

  const phaseOptions = [
    { value: "Planning", label: "Planning" },
    { value: "Development", label: "Development" },
    { value: "Testing", label: "Testing" },
    { value: "Deployment", label: "Deployment" },
  ];

  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Done", label: "Done" },
    { value: "Blocked", label: "Blocked" },
    { value: "Planned", label: "Planned" },
    { value: "On Hold", label: "On Hold" },
  ];

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: isEmployee ? `${emp.first_name} ${emp.last_name}` : emp.username,
  }));

  function getInitialFormData(data = null, isEdit = false) {
    if (isEdit && data) {
      return {
        project_name: data.project_name || "",
        description: data.description || "",
        startDate: data.start_date ? data.start_date.slice(0, 10) : "",
        endDate: data.end_date ? data.end_date.slice(0, 10) : "",
        status: data.status || "In Progress",
        phase: data.phase || "",
        companyName: data.company_name || "",
        clientName: data.client_name || "",
        assignedTo: Array.isArray(data.assigned_to)
          ? data.assigned_to.map((emp) =>
              typeof emp === "object" ? emp.id : emp
            )
          : [],
        designAvailable: data.design_available || false,
        srsFile: null,
        wireframeFile: null,
      };
    }
    return {
      project_name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "In Progress",
      phase: "",
      companyName: "",
      clientName: "",
      assignedTo: [],
      designAvailable: false,
      srsFile: null,
      wireframeFile: null,
    };
  }


  // useeffect 
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialFormData(initialData, isEditMode);
      setFormData(initial);
  
      if (isEditMode && initialData) {
        setOriginalDescription(initialData.description || "");
      } else {
        setOriginalDescription("");
      }
  
      setExistingSrsFileUrl(initialData?.srs_file || "");
      setExistingWireframeFileUrl(initialData?.wireframe_file || "");
    }
  
    const fetchLoggedInUserDetails = async () => {
      try {
        const userDetails = await fetchCurrentUserDetails(token);  
        if (isCompany && userDetails?.company_name) {
          setLoggedInEmployeeName(userDetails.company_name);
        } else if (userDetails?.first_name && userDetails?.last_name) {
          setLoggedInEmployeeName(`${userDetails.first_name} ${userDetails.last_name}`);
        } else {
          setLoggedInEmployeeName("User");
        }
  
      } catch (error) {
        console.error("Failed to fetch logged-in employee details:", error);
      }
    };
  
    if (token) {
      fetchLoggedInUserDetails();
    }
  }, [isOpen, isEditMode, initialData, token, isCompany]);
  

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    if (name === "assignedTo") {
      setFormData((prev) => ({
        ...prev,
        assignedTo: selectedOptions
          ? selectedOptions.map((option) => option.value)
          : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions ? selectedOptions.value : "",
      }));
    }
  };

  const handleDescriptionChange = (newDescription) => {
    if (isEmployee && isEditMode) {
      if (
        !newDescription.startsWith(originalDescription) ||
        newDescription.length < originalDescription.length
      ) {
        Swal.fire({
          icon: "warning",
          title: "Cannot Edit Previous Content",
          text: "As an employee, you can only add new updates to the description. Previous content cannot be removed or altered.",
        });
        return setFormData((prev) => ({ ...prev, description: originalDescription }));
      }
    }
    setFormData((prev) => ({ ...prev, description: newDescription }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim() || formData.description.trim() === "<p></p>") {
      newErrors.description = "Description cannot be empty.";
    }

    if (!isEditMode || isManagerOrAdmin) {
      if (!formData.project_name.trim()) newErrors.project_name = "Project name is required.";
      if (!formData.startDate) newErrors.startDate = "Start date is required.";
      if (formData.assignedTo.length === 0) newErrors.assignedTo = "Please assign at least one employee.";
    }

    if (!formData.endDate) newErrors.endDate = "Expected Completion Date is required.";
    if (!formData.phase) newErrors.phase = "Phase is required.";

    if (Object.keys(newErrors).length > 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: Object.values(newErrors).map(error => `<div>${error}</div>`).join(''),
      });
      return false;
    }
    return true;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let finalDescription = formData.description;

    if (isEmployee && isEditMode) {
      const now = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const formattedDate = now.toLocaleDateString('en-US', options);

      const updateHeader = `<p><strong>${loggedInEmployeeName} updated on ${formattedDate}:</strong></p>`;

      let newlyAddedContent = "";
      if (formData.description.length > originalDescription.length) {
        newlyAddedContent = formData.description.substring(originalDescription.length);
      }

      const hasNewContent = newlyAddedContent.trim() !== "" && newlyAddedContent.trim() !== "<p></p>";

      if (hasNewContent) {
        finalDescription = `${originalDescription}${updateHeader}${newlyAddedContent}`;
      } else if (originalDescription.trim() === "" && formData.description.trim() !== "" && formData.description.trim() !== "<p></p>") {
        finalDescription = `${updateHeader}${formData.description}`;
      } else {
        finalDescription = originalDescription;
      }
    }

    onSubmit({ ...formData, description: finalDescription });

    Swal.fire({
      icon: "success",
      title: isEditMode ? "Project Updated" : "Project Created",
      text: isEditMode
        ? "Project changes have been saved."
        : "Your new project has been created successfully!",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {isEditMode ? "Edit Project" : "Create New Project"}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block font-medium mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add project name"
              required
              disabled={isEditMode && !(roleId === 1 || isCompany)}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <CkEditor
              value={formData.description}
              onChange={handleDescriptionChange}
            />
            {isEmployee && isEditMode && (
              <p className="text-sm text-gray-500 mt-1">
                As an employee, you do not have permission to add or modify the description
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEditMode}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Expected Completion Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Phases/Stages <span className="text-red-500">*</span>
              </label>
              <Select
                name="phase"
                options={phaseOptions}
                value={phaseOptions.find(
                  (option) => option.value === formData.phase
                )}
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, { name: "phase" })
                }
                classNamePrefix="react-select"
                placeholder="Select Phase"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Status</label>
              <Select
                name="status"
                options={statusOptions}
                value={statusOptions.find(
                  (option) => option.value === formData.status
                )}
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, { name: "status" })
                }
                classNamePrefix="react-select"
                placeholder="Select Status"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={isEditMode && !(roleId === 1 || isCompany)}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Client Name</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={isEditMode && !(roleId === 1 || isCompany)}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">
              Assigned To <span className="text-red-700">*</span>
            </label>
            <Select
              name="assignedTo"
              options={employeeOptions}
              isMulti
              value={employeeOptions.filter((option) =>
                formData.assignedTo.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                handleSelectChange(selectedOptions, { name: "assignedTo" })
              }
              classNamePrefix="react-select"
              placeholder="Select employees"
              disabled={isEditMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">SRS Document</label>
              <FileUpload
                isView={isEmployee ? true : false}
                isCombine={false}
                initialFiles={existingSrsFileUrl ? [existingSrsFileUrl] : []}
                onFilesSelected={isManagerOrAdmin ? (files) => {
                  const selected = files[0];
                  setFormData((prev) => ({
                    ...prev,
                    srsFile: selected instanceof File ? selected : null,
                    srsFileUrl: typeof selected === "string" ? selected : "",
                  }));
                  setExistingSrsFileUrl("");
                } : undefined}
                disabled={isEmployee}
              />
            </div>

            {formData.designAvailable && (
              <div>
                <label className="block font-medium mb-1">
                  Wireframe Document
                </label>
                <FileUpload
                  isView={isEmployee ? true : false}
                  isCombine={false}
                  initialFiles={
                    existingWireframeFileUrl ? [existingWireframeFileUrl] : []
                  }
                  onFilesSelected={isManagerOrAdmin ? (files) => {
                    const selected = files[0];
                    setFormData((prev) => ({
                      ...prev,
                      wireframeFile: selected instanceof File ? selected : null,
                      wireframeFileUrl:
                        typeof selected === "string" ? selected : "",
                    }));
                    setExistingWireframeFileUrl("");
                  } : undefined}
                  disabled={isEmployee}
                />
              </div>
            )}

            <div className="flex flex-col justify-center mt-6">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="designAvailable"
                  checked={formData.designAvailable}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                  disabled={isEditMode && !isManagerOrAdmin}
                />
                <span className="text-gray-700">Design Available</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmitForm}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {isEditMode ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationModal;